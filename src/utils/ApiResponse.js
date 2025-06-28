//A reusable wwrapper to handle responses from the server clearly.

class ApiResponse {
    constructor(statusCode,data,message = 'Success'){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.success = statusCode < 400
    }
}

export {ApiResponse}