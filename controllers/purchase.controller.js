const {
    validateToken,
    Token
} = require("../models/tokens/tokens.model");
const {
    generateToken
} = require("../utils/generateToken");
const {
    generateUniqueId
} = require("../utils/randomId");

exports.purchaseElectricity = async (req, res) => {
    const {
        meter_number,
        token_value_days,
        purchased_date,
        amount
    } = req.body;
    try {
        //validate body
        const {
            error
        } = validateToken(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        //generate token
        const token = generateToken(amount);
        //check if token exist
        const tokenExist = await Token.findOne({
            token: token.token
        });
        //if exists
        if (tokenExist) {
            return res.status(400).json({
                success: false,
                message: "Token already exist"
            });
        }
        //create new record
        const data = new Token({
            meter_number,
            token_status: "NEW",
            token_value_days,
            purchased_date,
            amount,
            token: token.token,
            id: generateUniqueId(),
            token_value_days: token.days
        });
        await data.save();
        return res.status(200).json({
            success: true,
            message: `Token of ${amount} Rwf will light for ${token.days} days`,
            data
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

//get all tokens against entered meter number
exports.getAllTokens = async (req, res) => {
    try {
        const {
            meter_number
        } = req.body;
        //check if meter number is entered
        if (!meter_number) {
            return res.status(400).json({
                success: false,
                message: "Please enter meter number"
            });
        }
        //check length
        if (meter_number.length != 6) {
            return res.status(400).json({
                success: false,
                message: "Meter number should be 6 characters"
            });
        }
        //check if meter number exist
        const meterExist = await Token.find({
            meter_number
        });
        if (meterExist.length == 0) {
            return res.status(400).json({
                success: false,
                message: "Meter number does not exist"
            });
        }
        //get all tokens against meter number
        const tokens = await Token.find({
            meter_number
        });
        return res.status(200).json({
            success: true,
            message: "Tokens",
            tokens
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

//validate token
exports.validateToken = async (req, res) => {
    try {
        const {
            token
        } = req.params;
        //check if token is entered
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Please enter token"
            });
        }
        //check length
        if (token.length != 8) {
            return res.status(400).json({
                success: false,
                message: "Token should be 8 characters"
            });
        }
        //check if token exist
        const tokenExist = await Token.findOne({
            token
        });
        if (!tokenExist) {
            return res.status(400).json({
                success: false,
                message: "Token does not exist"
            });
        }
        //check if token is expired based on created date and token value days
        const createdDate = new Date(tokenExist.purchased_date);
        const tokenValueDays = tokenExist.token_value_days;
        const expiredDate = createdDate.setDate(createdDate.getDate() + tokenValueDays);
        const currentDate = new Date();
        if (currentDate > expiredDate) {
            //update token status
            await Token.updateOne({
                token
            }, {
                $set: {
                    token_status: "EXPIRED"
                }
            });
            const amount = tokenExist.amount;
            const days = tokenExist.token_value_days;
            return res.status(200).json({
                success: true,
                message: `Token of ${amount} Rwf will light for ${days} days`
            });
        }
        const amount = tokenExist.amount;
        const days = tokenExist.token_value_days;
        return res.status(200).json({
            success: true,
            message: `Token of ${amount} Rwf will light for ${days} days`
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}