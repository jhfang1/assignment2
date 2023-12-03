const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const product_data = require(__dirname + "/drinks.json");
const fs = require('fs');
//const users_reg_data = require(__dirname + "/user_data.json");
const qs = require('querystring');

app.use(express.urlencoded({ extended: true }));

app.all('*', function (req, res, next) {
  console.log(req.method + ' to ' + req.path);
  next();
});

//open and read stored usernames and passwords file, assign the value to data to convert into json string.
const data = fs.readFileSync('./user_data.json', 
  { encoding: 'utf8', flag: 'r'});
users_reg_data = JSON.parse(data);
console.log(users_reg_data);

//Server gives product data to page by defining products variable
app.get("/product_data.js", function (req, res) {
  res.type('.js');
  res.send(`let drinks = ${JSON.stringify(product_data)}`)
});

//Post Processing
app.post("/process_form", function (req, res) {
  console.log('in process + form', req.body);

  //Data Validation
  let errors = {}; 
  let hasInvalidQuantity = false;
  let hasNonNegInt = false;
  for (let i in product_data) {
    let qty = req.body['quantity' + i];
    
    //Check for isNonNegInt
    if (isNonNegInt(qty) === false) {
      errors['quantity' + i] = isNonNegInt(qty, true);
      hasNonNegInt = true;
      //Check if quantity is larger than quantity_available in drinks.json
    } else if (Number(req.body['quantity' + i]) > product_data[i].quantity_available) {
      console.log(product_data[i].quantity_available);
      hasInvalidQuantity = true;
      break;
    }
  }

  //Turn data from post to string
  const qstr = qs.stringify(req.body);
  console.log(qstr);
  
  //create invoice if valid
  if (hasNonNegInt || hasInvalidQuantity) {
    res.redirect(`store.html?${qstr}`);
  } else {
      //Track quantity_sold
      for (let i in product_data) {
      //KEEPING TRACK OF STOCK LEFT IR1 ASSIGNMENT 1
      //How much was sold just now
      product_data[i].total_sold = Number(product_data[i].total_sold + (parseInt(req.body['quantity' + i])));
  
      let quantity_remaining = [(product_data[i].quantity_available -= product_data[i].total_sold), product_data[i].total_sold]; // Reduce available quantity
      console.log(quantity_remaining);
    }
      //validation for login required!!!! $#########################################
    res.redirect(`login.html?${qstr}`);
  }
});

//Login information
app.post("/login", function(req, res) {
  console.log(req.body);
  
  //get the data from the hidden field.
  the_quantities = req.body['hidden'];

  let errors = [];
  let errorQueryString = '';
  console.log(the_quantities);
  the_username = req.body['email'].toLowerCase();
  the_password = req.body['password'];

  if (users_reg_data.hasOwnProperty(the_username)) {
    let userData = users_reg_data[the_username];
    let realName = userData.name;
    let userEmail = the_username;
    let nameString = `&name=${encodeURIComponent(realName)}&email=${encodeURIComponent(userEmail)}`;
    
    if (userData.password === the_password) {
      //if password matches, redirect with all info
      res.send(loginRedirectTemplate(the_quantities, realName, nameString));
      return;
    } else {
      errors.push(`Incorrect Password!`);
    }
  } else {
    errors.push(`Username ${the_username} does not exist!`);
  }
  errorQueryString = `error=${encodeURIComponent(errors)}`;
  res.redirect(`/login.html?${the_quantities}&${errorQueryString}`);

  //TEST

  /*let realName = users_reg_data.name;
  console.log(realName);
  //get last name, first name, and email in a single array
  let nameString = `&name=${encodeURIComponent(users_reg_data.name)}}&email=${encodeURIComponent(users_reg_data)}`;
  if (typeof users_reg_data[the_username] != 'undefined') {
      if (users_reg_data[the_username].password == the_password) {
        res.send(loginRedirectTemplate(the_quantities, realName, nameString));
      } else {
        errors.push(`Wrong Password!`);
      }
    } else {
      errors.push(`Username ${the_username} does not exist`);
      //If error redirect
      errorQueryString = `error=${encodeURIComponent(errors)}`;
      res.redirect(`/login.html?${the_quantities}&${errorQueryString}`);
    }*/
});

//Registration Information
app.post("/register", function(req, res) {
  console.log(req.body);
  the_quantities = req.body['hidden'];
  console.log(the_quantities);
  let errors = [];
  //Process the registration form
  username = req.body.email.toLowerCase();
  console.log(username);
  console.log(req.body.firstname);

  //Registration form validation
  if (typeof users_reg_data[username] != 'undefined') {
    errors.push(`${username} is already registered!`);
    console.log("e: username dupe");
  }
  if (!validateEmail(username)) {
    errors.push(`Invalid E-mail Format!`);
    console.log("e: invalid email");
  }
  if (req.body.password == '') {
    errors.push(`Password cannot be empty!`);
    console.log("empty");
  } else if (!validatePwd(req.body.password)) {
    errors.push(`Password is not valid! Requirements: Password must not include spaces, Must have at least one number and one special character and be 10-16 chars long!`);
    console.log("password not valid");
  }
  if (req.body.password != req.body.repeat_password) {
    errors.push(`Passwords do not match!`);
    console.log("passwords no match");
  } 
  if (req.body.firstname == '' || req.body.lastname == '') {
    errors.push(`Please enter your first and last name!`);
    console.log("no name");
  } else if (!validateName((req.body.firstname) + (req.body.lastname))) {
    errors.push(`Please enter a valid name!`);
    console.log("validate name");
  }
  if (errors.length == 0) {
    let newUser = {
        name: [req.body.firstname] + ' ' + [req.body.lastname],
        password: req.body.password
      }

    if (!users_reg_data) {
      users_reg_data = {};
    }

    users_reg_data[username] = newUser;
    console.log(newUser);
      fs.writeFileSync('user_data.json', JSON.stringify(users_reg_data));
      console.log("Saved: " + users_reg_data);
      //I would have redirected to store.html if we were using sessions.
      let realName = [req.body.firstname] + ' ' + [req.body.lastname];
      let nameString = `&firstname=${encodeURIComponent(req.body.firstname)}&lastname=${encodeURIComponent(req.body.lastname)}&email=${encodeURIComponent(req.body.email)}`;
      res.send(registerRedirectTemplate(the_quantities, realName, nameString));
  } else {
    let errorQueryString = '';
    let stickyFieldString = '';
    //ChatGPT 
    for (i=0; i < errors.length; i++) {
      errorQueryString += `error${i + 1}=${encodeURIComponent(errors[i])}&`;
    }
    res.redirect(`register.html?${the_quantities}&firstname=${encodeURIComponent(req.body.firstname)}&lastname=${encodeURIComponent(req.body.lastname)}&email=${encodeURIComponent(req.body.email)}&${errorQueryString}`);
  }
});

//rootdir will be in public starting from index.html
app.use(express.static(__dirname + '/public'));

//Start Server
app.listen(8080, () => console.log(`listening on port 8080`)); 


//Function check for integers
function isNonNegInt(q, returnErrors = false) {
  errors = []; //assume no errors at first
  if (Number(q) !=q) errors.push('Please enter a Number!'); //Check if string is a number value
  if (q < 0) errors.push('Amount cannot be negative'); //Check if non negative
  if (parseInt(q) !=q) errors.push('Must be a whole number'); //Check that it is an integer
  return returnErrors ? errors : errors.length == 0; //return errors
}

//Validate Email address
function validateEmail(email) {
  regex = /^[a-zA-Z0-9_.]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/i;
  return regex.test(email);
}

//Password Validation Must have 10-16 characters, no space

//######################IR2 Require that passwords have at least one number and one special character.##############################//
function validatePwd(pwd) {
  passwordRegex = /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])(?=.*\d)[^\s]{10,16}$/;
  return passwordRegex.test(pwd);
}

//Name Validation
function validateName(name) {
  //This will allow spaces and - in names, because it happens often. Numbers are still not allowed.
  fullNameRegex = /^[A-Za-z\s\-]{2,30}$/;
  return fullNameRegex.test(name);
}

function loginRedirectTemplate(qdata, name, invoiceName) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <script>
    // Redirect to a different page after 2 seconds
    setTimeout(function () {
      window.location.href = '/invoice.html?${qdata}${invoiceName}&login=YVCNSADYFVnmeqw9umr3i91mri9';
    }, 2000); // 2000 milliseconds (2 seconds)
    </script>
  </head>
  <body>
  <div> Welcome ${name}! You will be redirected shortly...</div>
  </body>
  </html>
  `
}

function registerRedirectTemplate(qdata, name, invoiceName) {
  return `
  <body>
  <script>
  // Redirect to a different page after 2 seconds
  setTimeout(function () {
    window.location.href = '/invoice.html?${qdata}${invoiceName}&login=dfszu9i8NUFJDNUfdNASU0djmgu90SDM';
  }, 2000); // 2000 milliseconds (2 seconds)
  </script>
  <div> Thank you for registering, ${name}! You will be redirected shortly...</div>
  </body>
  `
}
//Check if body req has product submit (this is probably not for the right assignment)

//Login
/*  DONE
    Create a simple Login page with email address and password fields as well as submit buttons for logging in or editing registration. Add a “register” link than when clicked will show the user a registration page. You may optionally put the login and registration on the same page.
    The user should only be required to login when purchasing. They should be able to view your store items without logging in first.
    The email address and password combination entered should be checked against the user information array that you retrieve from the saved file. When checking the email address, it should not matter what case was used. For example, email addresss itm352@hawaii.edu, ITM352@HAWAII.EDU, and ItM352@hAWaii.EdU should all be considered the same. That is, email addresss are CASE INSENSITIVE. On the other hand, passwords should be CASE SENSITIVE where “GRADER” is a different password than “grader”.
*/

//registration done
//Processing registration and login
//figure out how to store data 
//transfer store data to invoice.html, also transfer user data to invoice.html (this does not seem hard...)
//
//MAKE EVERYTHING STICKY (LAST)