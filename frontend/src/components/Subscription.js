import { useState } from 'react';
import axios from 'axios';

const Subscription = () => {
  const [plan, setPlan] = useState('');
  const [price, setPrice] = useState('');

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/subscribe', 
      { plan, price, duration_days: 30 }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('Subscription successful!');
  };

  return (
    <div>
      <h2>Subscription Plans</h2>
      <select onChange={(e) => setPlan(e.target.value)}>
        <option value="Basic">Basic - ₹99</option>
        <option value="Premium">Premium - ₹199</option>
      </select>
      <button onClick={handleSubscribe}>Subscribe</button>
    </div>
  );
};

export default Subscription;