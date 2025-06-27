const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const form = new FormData();
const filePath = 'C:/Users/TP COMPUTERS/OneDrive/Pictures/Screenshots/accountDeleted.jpg';

form.append('documentType', 'profilePhoto');
form.append('document', fs.createReadStream(filePath));

axios.post('http://localhost:5000/api/documents/uploadDocument', form, {
headers: {
  ...form.getHeaders(),
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InJpZGVyIiwidmVyaWZpZWQiOjAsImlhdCI6MTc1MTAyOTE4NSwiZXhwIjoxNzUxMDMwMDg1fQ.Ii1orjkBXk5q2pzYy5jjrKG8U3JevbfQo7irSCYO7io'
}


})
.then(res => console.log('Upload success:', res.data))
.catch(err => {
  if (err.response) {
    console.error('Server responded with:', err.response.status);
    console.error('Response data:', err.response.data);
  } else if (err.request) {
    console.error('No response received. Request details:', err.request);
  } else {
    console.error('Something else went wrong:', err.message);
  }
});
