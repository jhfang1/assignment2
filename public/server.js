const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const product_data = require(__dirname + "/drinks.json");
const fs = require('fs');
//const users_reg_data = require(__dirname + "/user_data.json");
const qs = require('querystring');

app.use(express.urlencoded({ extended: true }));

app.all('*', function (request, response, next) {
  console.log(request.method + ' to ' + request.path);
  next();
});

//open and read file, assign the value to data to convert into json string.
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
app.post("/process_form", function (request, response) {
  console.log('in process + form', request.body);

  //Data Validation
  let errors = {}; 
  let hasInvalidQuantity = false;
  let hasNonNegInt = false;
  for (let i in product_data) {
    let qty = request.body['quantity' + i];
    
    //Check for isNonNegInt
    if (isNonNegInt(qty) === false) {
      errors['quantity' + i] = isNonNegInt(qty, true);
      hasNonNegInt = true;
      //Check if quantity is larger than quantity_available in drinks.json
    } else if (Number(request.body['quantity' + i]) > product_data[i].quantity_available) {
      console.log(product_data[i].quantity_available);
      hasInvalidQuantity = true;
      break;
    }
  }

  //Turn data from post to string
  var qstr = qs.stringify(request.body);
  console.log(qstr);

  //create invoice if valid
  if (hasNonNegInt || hasInvalidQuantity) {
    let formData = request.body;
    response.redirect(`store.html?${qstr}`);
  } else {
      //Track quantity_sold
      for (let i in product_data) {
        
      //How much was sold just now
      product_data[i].quantity_sold = (parseInt(request.body['quantity' + i]));

      //KEEPING TRACK OF STOCK LEFT IR1 ASSIGNMENT 1
      let quantity_remaining = (product_data[i].quantity_available -= product_data[i].quantity_sold); // Reduce available quantity
      console.log(quantity_remaining);
      }
    response.redirect(`invoice.html?${qstr}`);
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

//Thinking Process :///
//if the number filled out in the form, which is q, is greater than the quantity available in product_data[1,2,3].quantity_available, then we want to return error.
//would it be possible to say if for let i in product_data,
// if request.body[i] > product_data[i].quantity_available
// then, hasInvalidQuantity will equal false.