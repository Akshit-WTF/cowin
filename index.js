const config = require('./config.json');
const crypto = require('crypto');
const unirest = require('unirest');
const chalk = require('chalk');
const ac = require("@antiadmin/anticaptchaofficial");
const moment = require('moment');
const puppeteer = require('puppeteer');
let PupPage;
let otpReqInterval;

if (config.autotoken === true) {
    requestOTP();
    otpReqInterval = setInterval(function () {
        requestOTP();
    }, 870000);
    const app = require('express')();
    app.use(require('body-parser').json());
    app.post('/sms', async function (req, res) {
        let str = req.body.message;
        for (const i of str.split(' ')) {
            let maybeOTP = i.slice(0, -1);
            if (maybeOTP.length === 6 && !isNaN(parseInt(maybeOTP))) {
                console.log(maybeOTP)
            }
        }
        res.sendStatus(200);
    });
    app.listen(80);
}

if (config.autotoken === false) {
    (async () => {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://selfregistration.cowin.gov.in');
        page.on('response', async (response) => {
            const request = response.request();
            if (request.url().includes('validateMobileOtp') && request.method() === "POST"){
                const body = await response.json();
                if (body.token) {
                    token = `Bearer ${body.token}`;
                    console.log(chalk.greenBright(`${moment().format('LTS')}: Regenerated the authorization token successfully.`));
                    checkAlive();
                }
            }
        });
        PupPage = page;
    })();
}

if (config.beneficiaries.length === 0 || !config.phone || !config["anti-captcha-key"]) {
    console.log(chalk.redBright('Variable(s) missing in the config file. Please fix to continue.'));
    process.exit(0);
}

ac.setAPIKey(config["anti-captcha-key"]);
ac.shutUp();

let otpUUID = '';
let token = '';
let captchaRequested = false;
let isAuthorized = false;

function replace(original, toReplace, replacement) {
    return original.replace(new RegExp(toReplace, "gi"), replacement);
}

function requestOTP() {
    unirest('POST', 'https://cdn-api.co-vin.in/api/v2/auth/generateMobileOTP')
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify({
            "mobile": config.phone,
            "secret": "U2FsdGVkX1+9pRYVTYpP7nNgkOD7vbxwd74VM9D5OYctbNlcUq9frLeFXrIRFTHlorr+d98h5aaZ33/8O91uxw=="
        }))
        .end(function (res) {
            otpUUID = res.body.txnId;
        });
}

function getAuthToken(id, otp) {
    return new Promise(function (resolve) {
        unirest('POST', 'https://cdn-api.co-vin.in/api/v2/auth/validateMobileOtp')
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({
                "otp": crypto.createHash('sha256').update(otp).digest('hex'),
                "txnId": id
            }))
            .end(function (res) {
                resolve(res.body.token);
            });
    });
}

function convertSVGtoPNG(svg) {
    return new Promise(function (resolve) {
        unirest('POST', 'http://svg2jpg.akshit.me')
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify({
                "svg": svg
            }))
            .end(function (res) {
                resolve(res.body.jpeg);
            });
    })
}

function getCaptcha() {
    if (captchaRequested === true) return false;
    return new Promise(function (resolve, reject) {
        unirest('POST', 'https://cdn-api.co-vin.in/api/v2/auth/getRecaptcha')
            .headers({
                'Authorization': token
            })
            .end(async function (res) {
                captchaRequested = true;
                let svg = res.body.captcha;
                svg = svg.replace(/\\\//g, "/");
                for (let i = 111; i < 999; i += 111) {
                    svg = replace(svg, `fill="#${i}"`, 'fill="#fff"')
                    svg = replace(svg, `stroke="#${i}"`, 'stroke="none"')
                }
                let base64 = await convertSVGtoPNG(svg);
                let captcha = await ac.solveImage(base64);
                resolve(captcha);
            });
    });
}

let sessionCheckInterval = setInterval(function () {
    checkAlive();
}, 30000);

function checkAlive() {
    unirest('GET', 'https://cdn-api.co-vin.in/api/v2/appointment/beneficiaries')
        .headers({
            'Authorization': token
        })
        .end(function (res) {
            if (res.status !== 401) {
                isAuthorized = true;
                console.log(chalk.greenBright(`${moment().format('LTS')}: Session status confirmed to be alive.`));
            } else {
                if (config.autotoken === false) {
                    PupPage.reload();
                }
                console.log(chalk.redBright(`${moment().format('LTS')}: Session has expired.`));
            }
        });
}

let mainInterval = setInterval(function () {
    if (!isAuthorized) return console.log(chalk.redBright(`${moment().format('LTS')}: Session not authorized, not checking for available slots.`));
    console.log(chalk.blueBright(`${moment().format('LTS')}: Checking for available slots on the COWIN portal.`));
    unirest('GET', 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=' + config.pincode + '&date=' + moment().format('DD-MM-YYYY'))
        .headers({
            'Authorization': token
        })
        .end(async function (res) {
            try {
                let foundSlot = false;
                for (const centre of res.body.centers) {
                    for (const session of centre.sessions) {
                        if ((session.min_age_limit === 18) === config["18"] && session.available_capacity !== 0) {
                            foundSlot = true;
                            let captcha = await getCaptcha();
                            if (captcha === false) return;
                            unirest('POST', 'https://cdn-api.co-vin.in/api/v2/appointment/schedule')
                                .headers({
                                    'Authorization': token,
                                    'Content-Type': 'application/json'
                                })
                                .send(JSON.stringify({
                                    "center_id": centre.center_id,
                                    "session_id": session.session_id,
                                    "captcha": captcha,
                                    "beneficiaries": config.beneficiaries,
                                    "slot": session.slots[0],
                                    "dose": 1,
                                }))
                                .end(function (res) {
                                    if (res.appointment_confirmation_no) {
                                        console.log(chalk.greenBright('Appointment booked successfully! Please login to check.'));
                                    } else {
                                        console.log(chalk.redBright('Tried booking an appointment but failed. Restart this script.'));
                                    }
                                    if (config.autotoken === true) {
                                        clearInterval(otpReqInterval);
                                    }
                                    clearInterval(mainInterval);
                                    clearInterval(sessionCheckInterval);
                                    process.exit(0);
                                });
                        }
                    }
                }
                if (foundSlot === false) {
                    console.log(chalk.redBright('No slots are available right now. Will keep checking.'));
                }
            } catch (e) {
                console.log(chalk.redBright('We might be getting rate limited.'));
            }
        });
}, 1750);