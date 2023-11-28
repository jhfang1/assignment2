const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const product_data = require(__dirname + "/drinks.json");
const fs = require('fs');
//const users_reg_data = require(__dirname + "/user_data.json");
const qs = require('querystring');

app.use(express.urlencoded({ extended: true }));

var formData;

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
  var qstr = qs.stringify(req.body);
  console.log(qstr);

  //create invoice if valid
  if (hasNonNegInt || hasInvalidQuantity) {
    formData = qstr;
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
    res.redirect(`login.html`);
  }
});

//Login information
app.post("/login", function(req, res) {
  console.log('in process + form', req.body);
  the_username = req.body['email'].toLowerCase();
  the_password = req.body['password'];
  if (typeof users_reg_data[the_username] != 'undefined') {
      if (users_reg_data[the_username].password == the_password) {
        // replace with sending an error message on current page #############################################################
        res.send(`
        <body>
        <script>
        // Redirect to a different page after 2 seconds
        setTimeout(function () {
          window.location.href = '/invoice.html';
        }, 2000); // 2000 milliseconds (2 seconds)
        </script>
        <div> Welcome ${the_username}! You will be redirected shortly...</div>
        </body>
        `);
        //still need to figure this out
        if (req.body.hasOwnProperty('purchase_submit')) {
          res.redirect(`invoice.html?${qstr}`)
        }
      } else {
          res.send(`Wrong password!`);
      }
      return;
  }
  res.send(`${the_username} does not exist`);
});

//Registration Information
app.post("/register", function(req, res) {
  console.log('in process + form', req.body);
  let errors = [];
  //Process the registration form
  username = req.body.email.toLowerCase();
  console.log(username);

  //Registration form validation
  if (typeof users_reg_data[username] != 'undefined') {
    errors.push(`Hey! ${username} is already registered!`);
  }
  if (!validateEmail(username)) {
    errors.push(`Invalid E-mail Format please enter a valid E-mail address.`)
  }
  if (req.body.password == '') {
    errors.push(`Password cannot be empty!`)
  } else if (!validatePwd(req.body.password)) {
    errors.push(`Password must not include spaces and must be between 10-16 characters`)
  }
  if (req.body.password != req.body.repeat_password) {
    errors.push(`Repeat password not the same as password!`);
  } 
  if (req.body.firstname == '' || req.body.lastname == '') {
    errors.push(`Please enter your first and last name!`)
  } else if (!validateName([req.body.firstname] + ' ' + [req.body.lastname])) {
    errors.push(`Please check your name! It must only contain letters and be between 2-30 characters long`)
  }
  if (Object.keys(errors).length == 0) {
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
      res.send(`
      <body>
      <script>
      // Redirect to a different page after 2 seconds
      setTimeout(function () {
        window.location.href = '/invoice.html';
      }, 2000); // 2000 milliseconds (2 seconds)
      </script>
      <div> Thank you for registering, ${[req.body.firstname] + ' ' + [req.body.lastname]}! You will be redirected shortly...</div>
      </body>
      `);
  } else {
    //var erstr = qs.stringify(errors);
    res.redirect(`register.html?${errors}`);
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

//Password Validation
function validatePwd(pwd) {
  passwordRegex = /^[^\s]{10,16}$/;
  return passwordRegex.test(pwd);
}

//Name Validation
function validateName(name) {
  fullNameRegex = /^[A-Za-z]{2,30}$/;
  return fullNameRegex.test(name);
}

//Check if body req has product submit (this is probably not for the right assignment)


//REQ
// EMAIL ADDRESS CASE INSENSITIVE
//  can only contain letters, numbers, and the characters “_” and “.” domain must end in . something y must only contain letters and numbers
// may only be one email


//pWD REQ
//min 10, max 16
// space not allowed
// case sensitive
// confirm password
//add full name, only letters

//MAKE EVERYTHING STICKY