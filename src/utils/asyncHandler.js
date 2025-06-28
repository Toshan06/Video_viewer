//A resuaable wrapper to handle error without using try catch everywhere.

const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>{next(err)})
    }
}

export {asyncHandler}