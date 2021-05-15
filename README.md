
# COWIN - Brute Force

This is a simple yet powerful script to book an appointment for the COVID-19 vaccine on the COWIN website by utilizing the power of powerful computing. I wrote this script after understanding how hard it is to obtainin an appointment on the COWIN platform.

## Basic Requirements

In order to use this script, you will need the following:

- **Node.JS** (Version 14.17.0) [Official Website](https://nodejs.org/en/download)
- **Anti-Captcha API Key** [Official Website](https://anti-captcha.com)
  You can get almost 70 free captcha solves as demo credits after you sign up and verify your phone number.
- **COWIN Account** [Official Website](https://selfregistration.cowin.gov.in)
- **Beneficiary ID**

## Token Obtaining Methods

The COWIN portal operates with API authorization tokens. These are obtained by OTP validation and are valid for 15 minutes. I have created two methods to obtain a token:

### Automatic Method:

Read the Word document named `How to enable automatic OTP fetching for the COWIN Appointment booking script.docx` in the root directory of this repository. 
- Open config.json on your computer and change `autotoken` to `true`.

### Manual Method:

This method is not recommended, but you may use it if you do not wish to follow all the steps in automatic mode.

- Change `autotoken` to `false` in config.json on your computer.
- Login to the COWIN portal in the browser window that opens on your computer once you run the script.

## Understanding CONFIG.JSON

This is the file that contains all the configuration data required for the script to function.

```json
{  
  "anti-captcha-key": "CAN BE OBTAINED FROM ANTI-CAPTCHA.COM AND APPLY FOR DEMO CREDITS.",  
  "phone": "PHONE NUMBER REGISTERED WITH ON COWIN",  
  "beneficiary": "BENEFICIARY ID",  
  "pincode": "PIN_CODE",  
  "18": true, // put true if you are seeking 18-44 registrations and false if you are seeking 45+ registrations
  "autotoken": false  // put true if you want to use the Automatic method of token fetching or false if you wish to use the manual method.
}
```

## How to run?

In order to run the script, please fill the CONFIG.JSON file appropriately.

After that, Shift + Right click inside the folder that contains the index.js file.

Select `Open Powershell` or `Open CMD`.

If you are running the script for the first time, run `npm install`.

Then run, `node index`.
