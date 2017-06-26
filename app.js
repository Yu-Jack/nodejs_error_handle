const express = require('express')
const app = express()
const http = require('http')

// const wrap = fn => (...args) => fn(...args).catch(args[2])
const wrap = asyncRoute => {
    return (...args) => {
        asyncRoute(...args).catch(err => {
            const next = args[2]
            next(err)
        })
    }
}

let normalFunctionError = () => {
    throw 'Normal Function Error'
}

let promiseFunctionError = () => {
    return new Promise((res, rej) => {
        throw 'Promise Function Error'
    })
}

// 如果用到 async 類型的 function，裡面要用 try-catch 才有辦法把 error 丟到外面來
// 否則，不透過 try-catch 是沒辦法抓到 Promise 裡面的 error
let asyncFunctionError = () => {
    return new Promise((res, rej) => {
        http.get('http://www.google.com', (response) => {
            try {
                throw 'SetTimeout Error with try catch'
            } catch(e) {
                rej(e)
            }
        })
    })
}

// #######################################
// #                                     #
// #                                     #
// # 這裡是處理 async function error 範例 #
// #                                     #
// #######################################

// 一般沒有用到 async 的時候，都會 pass 給 express router
app.get('/express_catach_error_normal_function', (req, res) => {
    throw 'express_catach_error_normal_function'
    res.status(200).json({
        message: 'Success'
    })
})

// 用到 async 的時候，開始要用 try-catch 去處理或是用 wrap 去包起來
app.get('/express_catch_error_normal_other_function_way_1', async (req, res, next) => {
    try {
        normalFunctionError()
    } catch (error) {
        console.log('HI_2');
        next(error)
    }
})

app.get('/express_catch_error_normal_other_function_way_2', wrap(async (req, res, next) => {
    normalFunctionError()
    console.log('This line can\'t be executed.');
}))

// 直接用 try-catch 去丟給 express, HI_1 和 HI_2 的 catch 都會抓到
app.get('/express_catch_error_promise_function_way1', async (req, res, next) => {
    try {
        let a = await promiseFunctionError().catch((error) => {
            console.log('HI_1');
            throw error
        })
        console.log('This line can\'t be executed.');
    } catch (error) {
        console.log('HI_2');
        next(error)
    }
})

// 交給 promise catch 之後再丟給 express
app.get('/express_catch_error_promise_function_way2', wrap(async (req, res, next) => {
    let a = await promiseFunctionError().catch((error) => {
        console.log('HI_1');
        throw error
    })
    console.log('This line can\'t be executed.');
}))

// 利用 wrap 包起來丟給 express
app.get('/express_catch_error_promise_function_way3', wrap(async (req, res, next) => {
    let a = await promiseFunctionError()
    console.log('This line can\'t be executed.');
}))

// 裡面的 catch 抓到後傳給外面的 catch 之後再用 next 丟到 express 裡面
app.get('/express_catch_error_async_function_way_1', async (req, res, next) => {
    try {
        let a = await asyncFunctionError().catch((error) => {
            console.log('HI_1');
            throw error
        })
        console.log('This line can\'t be executed.');
    } catch (e) {
        console.log('HI_2');
        next(e)
    }
})

// 如果裡面用 return 的話，外面就抓不到 error 了，程式也就會一直執行
app.get('/express_catch_error_async_function_wrong_way_1', async (req, res, next) => {
    try {
        let a = await asyncFunctionError().catch((error) => {
            console.log('HI_1');
            return next(error)
        })
        // 這樣會一直執行下去
        console.log('This line can\'t be executed.');
    } catch (e) {
        console.log('HI_2');
        next(e)
    }
})

// 外面用 wrap 取代 try-catch
app.get('/express_catch_error_async_function_way_2', wrap(async (req, res, next) => {
    let a = await asyncFunctionError().catch((error) => {
        console.log('HI_1');
        throw error
    })
    console.log('This line can\'t be executed.');
}))

// 如果裡面用 return 的話，外面就抓不到 error 了，程式也就會一直執行
app.get('/express_catch_error_async_function_wrong_way_2', wrap(async (req, res, next) => {
    let a = await asyncFunctionError().catch((error) => {
        console.log('HI_1');
        return next(error)
    })
    // 這樣會一直執行下去
    console.log('This line can\'t be executed.');
}))




// ######################################
// #                                    #
// #                                    #
// #    這裡是處理 router error 的範例   #
// #                                    #
// ######################################

let asyncFunction = () => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res('Good Job')
        }, 1000)
    })
}

app.get('/express_route_function_normal', async (req, res, next) => {
    try {
        let a = await asyncFunction().catch((error) => {
            console.log('HI_1');
            next(error)
        })
        res.status(200).json({
            message: a
        })
    } catch (error) {
        console.log('HI_2');
        next(error)
    }
})

// Use try/catch to pass router error
app.get('/express_catch_error_route_function_way_1', async (req, res, next) => {
    try {
        let a = await asyncFunction().catch((error) => {
            console.log('HI_1');
            next(error)
        })
        throw 'Oops, router is wrong.'
        res.status(200).json({
            message: a
        })
    } catch (error) {
        console.log('HI_2');
        next(error)
    }
})

// Use wrap to pass router error
app.get('/express_catch_error_route_function_way_2', wrap(async (req, res, next) => {
    let a = await asyncFunction().catch((error) => {
        console.log('HI_1');
        next(error)
    })
    throw 'Oops, router is wrong.'
    res.status(200).json({
        message: a
    })
}))

// Express Catch Error
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        message: err
    })
})

app.listen(8080, () => {
    console.log('Server Start');
})