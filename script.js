body {
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.container {
    max-width: 600px;
    background-color: #ffffff;
    padding: 30px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    text-align: center;
    width: 100%;
}

.element {
    margin-bottom: 22px;
}

.input-group {
    text-align: left;
    margin-bottom: 10px;
}

input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    transition: background-color 0.3s;
    margin-bottom: 22px;
}

button:hover {
    background-color: #0056b3;
}

@media (max-width: 600px) {
    .container {
        padding: 20px;
    }

    input {
        width: 92%;
    }

    button {
        width: 100%;
    }
}

/* Printable Bill Styling */
.printable-bill {
    display: none;
    padding: 20px;
    background-color: #fff;
    border: 1px solid #ccc;
    margin: 20px auto;
    max-width: 600px;
}

@media print {
    body * {
        visibility: hidden;
    }
    .printable-bill, .printable-bill * {
        visibility: visible;
    }
    .printable-bill {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
    }
}

.hidden {
    display: none;
}
