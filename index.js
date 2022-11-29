const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

//  Stripe ar-------
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const jwt = require('jsonwebtoken')

const app = express();
const port = process.env.PORT || 5000;

// middle ware--
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lhckmem.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {

        const usersCollection = client.db("SellPhones").collection("users");
        const categoriesCollection = client.db("SellPhones").collection("categories");
        const productsCollection = client.db("SellPhones").collection("products");
        const bookedProductCollection = client.db("SellPhones").collection("BookedProduct");

        const reviewsCollection = client.db("SellPhones").collection("reviews");

        const paymentsCollection = client.db("SellPhones").collection("payments");
        const advertiseCollection = client.db("SellPhones").collection("advertise");


        //save user data ---------
        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.send(result);
        });

        // get user for seller--------
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            // console.log(email);
            const query = { email };
            const user = await usersCollection.findOne(query)
            res.send({ isSeller: user?.sellerAccount === true });
        });

        // get admin user-----
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });

        //load categories all-------
        app.get('/categories', async (req, res) => {
            const query = {}
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        //load categories products -------
        app.get('/products/:cateName', async (req, res) => {
            const name = req.params.cateName;
            const query = {}
            const allProducts = await productsCollection.find(query).toArray();
            const products = allProducts.filter(pro => pro.categoryName === name)
            res.send(products);
        });


        // -------------------------------------
        //              seller only 
        //--------------------------------------

        // seller add a product data save---
        app.post('/addProduct', async (req, res) => {
            const addProduct = req.body;
            const result = await productsCollection.insertOne(addProduct);
            res.send(result);
        });

        // seller get my product data save---------
        app.get('/myProduct/:email', async (req, res) => {
            const email = req.params.email;

            const query = { sellerEmail: email }
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        });

        // seller delete product ---------
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;

            // advertise----------------
            const filter = {proId : id}
            const advertise = await advertiseCollection.deleteOne(filter);
            
           // products taki-------------
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        });

        //-----------------------------------------------------------



        // -------------------------------------
        //              buyers only 
        //--------------------------------------

        // booked product data save---
        app.post('/bookedProduct', async (req, res) => {
            const bookedData = req.body;
            const result = await bookedProductCollection.insertOne(bookedData);
            res.send(result);
        });

        // get my orders only buyers----------
        app.get('/bookedProduct/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email }
            const result = await bookedProductCollection.find(query).toArray();
            res.send(result);
        });


        // get single booking data----------
        app.get("/bookingData/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const singleBooking = await bookedProductCollection.findOne(query);
            res.send(singleBooking)
        });



        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.productPrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            })

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        });


        // save user payment data ---------
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);

            // product a set-----------
            const id = payment.productId;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    sold: true,
                    transactionId: payment.transactionId,
                }
            }
            const updatedResult = await productsCollection.updateOne(filter, updatedDoc)

            //booking products a set-----------
            const bookId = payment.payId;
            const filter2 = { _id: ObjectId(bookId) }
            const updatedDoc2 = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                }
            }
            const updatedResult2 = await bookedProductCollection.updateOne(filter2, updatedDoc2)


            res.send(result)
        });
        //-----------------------------------------------------------


        //admin show all buyers info
        app.get('/allBuyers', async (req, res) => {
            const query = {}
            const users = await usersCollection.find(query).toArray();
            const buyers = users.filter(buyer => buyer.sellerAccount === false)
            const result = buyers.filter(admin => admin.role !== 'admin');
            res.send(result)
        })


        //admin show all sellers info
        app.get('/allSellers', async (req, res) => {
            const query = {}
            const users = await usersCollection.find(query).toArray();
            const sellers = users.filter(buyer => buyer.sellerAccount === true)
            const result = sellers.filter(admin => admin.role !== 'admin');
            res.send(result)
        });

        // admin delete any buyer or sellers-----------
        app.delete('/users/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });


        // get all reviews-----------------
        app.get('/reviews', async (req, res) => {
            const query = {}
            const reviews = await reviewsCollection.find(query).toArray();
            res.send(reviews);
        });



        // sellers advertise ------------------------------
        app.put('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { proId: id }
            const options = { upsert: true }
            const updateDoc = {
                $set: product,
            }
            const result = await advertiseCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // get seller advertise products---------------
        app.get('/advertise', async (req, res) => {
            const query = {}
            const result = await advertiseCollection.find(query).toArray();
            res.send(result)
        })

















    }
    catch (err) {
        console.log(err);
    }
}


run().catch(err => console.log(err))



app.get('/', (req, res) => {
    res.send('Sell phones BD server is running.............');
});

app.listen(port, () => {
    console.log('Sell phones BD server running on:', port);
})