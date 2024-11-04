require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const { upload, s3 } = require('./s3config');
const cors = require('cors');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure CORS
const corsOptions = {
    origin: 'http://localhost:3000', // Update this to your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// CRUD Routes for Customers

// Create Customer
app.post('/createcustomer', upload.single('file'), async (req, res) => {
    const { name, email } = req.body;
    const fileUrl = req.file.location;

    try {
        const customer = await Customer.create({ name, email, fileUrl });
        return res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Get Customers
app.get('/getcustomer', async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Update Customer
app.put('/updatecustomer/:id', upload.single('file'), async (req, res) => {
    const { name, email } = req.body;
    let fileUrl;

    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // If a new file is uploaded, update the S3 file
        if (req.file) {
            fileUrl = req.file.location;

            // Delete the previous file from S3
            const oldFileKey = customer.fileUrl.split('/').pop();
            const deleteParams = {
                Bucket: "crudbucketdeval",
                Key: oldFileKey
            };

            await s3.send(new DeleteObjectCommand(deleteParams));
        }

        // Update the customer record in the database
        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            { name, email, ...(fileUrl && { fileUrl }) },
            { new: true }
        );

        res.status(200).json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete Customer
app.delete('/deletecustomer/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Delete the file from S3
        const fileKey = customer.fileUrl.split('/').pop();

        console.log(customer.fileUrl, "11111")
        console.log(fileKey, "222222222");


        const deleteParams = {
            Bucket: "crudbucketdeval",
            Key: fileKey
        };

        await s3.send(new DeleteObjectCommand(deleteParams));

        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});