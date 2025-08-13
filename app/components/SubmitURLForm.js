'use client';
import React, { useState } from 'react';

const SubmitURLForm = () => {
  const [url, setUrl] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isValidUrl(url)) {
      try {
        const response = await fetch('/api/scrape-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (response.ok) {
          alert('URL submitted successfully!');
        } else {
          alert(`Error: ${data.message}`);
        }
      } catch (error) {
        alert('An error occurred. Please try again.');
      }
    } else {
      alert('Please enter a valid URL.');
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter Rate My Professor URL"
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
};

export default SubmitURLForm;
