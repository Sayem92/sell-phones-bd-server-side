const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


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

        const addProductCollection = client.db("SellPhones").collection("AddProduct");

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
        app.get('/categories/:id', async (req, res) => {
            const id = parseFloat(req.params.id);
            const query = {}
            const allProducts = await productsCollection.find(query).toArray();
            const products = allProducts.filter(pro => pro.proId === id)
            res.send(products);
        });

        // booked product data save---
        app.post('/bookedProduct', async (req, res) => {
            const bookedData = req.body;
            const result = await bookedProductCollection.insertOne(bookedData);
            res.send(result);
        });

        // admin && seller add a product data save---
        app.post('/addProduct', async (req, res) => {
            const addProduct = req.body;
            const result = await addProductCollection.insertOne(addProduct);
            res.send(result);
        });

        // admin && seller get my product data save---------
        app.get('/myProduct', async (req, res) => {
            const query = {}
            const result = await addProductCollection.find(query).toArray();
            res.send(result);
        });

        // admin && seller delete product ---------
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await addProductCollection.deleteOne(query);
            res.send(result);
        });








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