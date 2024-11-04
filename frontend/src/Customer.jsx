import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerManager = () => {
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', file: null });
    const [editingCustomerId, setEditingCustomerId] = useState(null);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('http://localhost:3001/getcustomer');
            setCustomers(res.data);
        } catch (err) {
            console.error('Failed to fetch customers');
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
            ...(e.target.files && { file: e.target.files[0] })
        });
    };

    const handleSubmit = async () => {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        if (formData.file) data.append('file', formData.file);

        try {
            if (editingCustomerId) {
                await axios.put(`http://localhost:3001/updatecustomer/${editingCustomerId}`, data);
            } else {
                await axios.post('http://localhost:3001/createcustomer', data);
            }
            fetchCustomers();
            setFormData({ name: '', email: '', file: null });
            setEditingCustomerId(null);
        } catch (err) {
            console.error('Failed to submit customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomerId(customer._id);
        setFormData({ name: customer.name, email: customer.email, file: null });
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:3001/deletecustomer/${id}`);
            fetchCustomers();
        } catch (err) {
            console.error('Failed to delete customer');
        }
    };

    return (
        <div>
            <h2>Customer Management</h2>
            <form>
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />
                <input
                    type="file"
                    name="file"
                    onChange={handleChange}
                />
                <button type="button" onClick={handleSubmit}>
                    {editingCustomerId ? 'Update Customer' : 'Add Customer'}
                </button>
            </form>

            <ul>
                {customers.map(customer => (
                    <li key={customer._id}>
                        {customer.name} - {customer.email}
                        <a href={customer.fileUrl} target="_blank" rel="noopener noreferrer">View File</a>
                        <button onClick={() => handleEdit(customer)}>Edit</button>
                        <button onClick={() => handleDelete(customer._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CustomerManager;
