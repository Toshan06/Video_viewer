//A reusable wrapper to handle errors clearly. It helps standardize how errors are thrown and caught across your app.

class ApiError extends Error{
    constructor(
        statusCode,
        message = 'Something went wrong',
        error = [],
        stack = ''
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null,
        this.message = message,
        this.success = false,
        this.error =   error

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}