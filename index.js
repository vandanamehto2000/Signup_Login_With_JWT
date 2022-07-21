const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const bcrypt = require("bcrypt");

app.use(express.json());

// create connection
var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})
connection.connect((err) => {
    if (err) throw err;
    console.log("database has connected....")
})

// create table
var sql = "CREATE TABLE IF NOT EXISTS students (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password VARCHAR(255));";
connection.query(sql, (err, result) => {
    if (err) {
        console.log(err);
    } else {
        console.log("table has created......")
    }
})

// user need to register first
app.post("/register", async (req, res) => {
    const saltRound = 10;
    const password = req.body.password;
    const encryptedPassword = await bcrypt.hash(password, saltRound);

    let body = req.body;
    let info = {
        name: body.name,
        email: body.email,
        password: encryptedPassword
    }
    connection.query("select email from students  WHERE email = '" + req.body.email + "'", (err, result, field) => {
        if (result.length == 0) {
            let sql = "INSERT INTO students SET ?";
            let query = connection.query(sql, info, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("you have register successfully")
                }

            })
            res.json({
                message: "you have register successfully"
            })

        } else {
            console.log("user already exists, please login you account")
            res.json({
                message: "user already exists, please login you account"
            })
        }

    })

})


// user need to login with their email and password

app.post("/login", (req, res) => {
    const jwtSecretKey = process.env.SECRET_KEY;
    let body = req.body;
    let info = {
        email: body.email,
        password: body.password
    }
    connection.query("select * from students WHERE email = '" + req.body.email + "'", async (err, result, field) => {
        if (err) {
            console.log(err);
            res.json({
                failed: "'error occur"
            })
        } else {
            if (result.length > 0) {
                let comparePassword = await bcrypt.compare(req.body.password, result[0].password);
                if (comparePassword) {
                    const token = jwt.sign({ email: body.email }, jwtSecretKey);
                    res.json({
                        message: "login successfully",
                        token: token
                    })
                } else {
                    console.log("password does not match");
                    res.json({
                        message: "password does not match"
                    })
                }
            } else {
                console.log("email does not exist");
                res.json({
                    message: "email does not exist"
                })
            }
        }

    })
})

// after login user need to verify for authorization
app.post("/userVerify", (req, res) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return res.json({
            message: "Please provide the token",
        });
    }
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, "vandana");
    res.json({
        message: "fatch successfully",
        decoded
    })

});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`server has started running on ${PORT} `);
});