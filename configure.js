const readline = require('readline');
const fs = require('fs');
const path = require('path');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let originalConfig = require('./config.json');

let newConfig = {
    "18": true,
};

(async () => {
    console.log('To cancel at any time press Ctrl + C. Leave blank to use previous value.');
    askQuestions();
    function askQuestions() {
        rl.question('Enter your Anti Captcha API Key: ', (answer) => {
            if (!answer) answer = originalConfig["anti-captcha-key"];
            newConfig["anti-captcha-key"] = answer;
            console.log(answer)
            rl.question('Enter the phone number: ', (answer) => {
                if (!answer) answer = originalConfig["phone"];
                newConfig["phone"] = answer;
                rl.question('Enter the beneficiary ids separated by commas: ', (answer) => {
                    if (!answer) {
                        newConfig.beneficiaries = originalConfig.beneficiaries
                    } else {
                        newConfig.beneficiaries = answer.trim().split(',');
                    }
                    rl.question('Enter the PinCode: ', (answer) => {
                        if (!answer) answer = originalConfig["pincode"];
                        newConfig.pincode = answer;
                        rl.question('Are you using Auto Token fetch? (Y/N) ', (answer) => {
                            if (!answer) {
                                answer = originalConfig["autotoken"];
                                newConfig.autotoken = answer;
                            } else {
                                answer = answer.toLowerCase();
                                newConfig.autotoken = answer === 'y';
                            }
                            rl.question('What dose are you applying for? (1 or 2) ', (answer) => {
                                if (!answer) answer = originalConfig["dose"];
                                answer = parseInt(answer);
                                newConfig.dose = answer;
                                setTimeout(function () {
                                    console.log(`Generated the config file and saved it.`);
                                    fs.writeFileSync(path.join(__dirname, './config.json'), JSON.stringify(newConfig));
                                    process.exit(0);
                                }, 500)
                            });
                        });
                    });
                });
            });
        });
    }
})();