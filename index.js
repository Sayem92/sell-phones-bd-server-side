const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        const categoriesCollection = client.db("SellPhones").collection("categories");
        const productsCollection = client.db("SellPhones").collection("products");

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