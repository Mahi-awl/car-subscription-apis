
const sendResponse = (res, statusCode, success, message, data = null) => {
    const responsePayload = {
        success: success,
        message: message
    };

    if (data) {
        responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
};

export default sendResponse;