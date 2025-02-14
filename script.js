domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];

    document.getElementById('moreButton').addEventListener('click', showMoreOptions);
    document.getElementById('option1-button').addEventListener('click', switchToOption1);
    document.getElementById('option2-button').addEventListener('click', switchToOption2);
    document.getElementById('option3-button').addEventListener('click', switchToOption3);
    document.getElementById('option4-button').addEventListener('click', switchToOption4);
    document.getElementById('option5-button').addEventListener('click', switchToOption5);
    document.getElementById('homePageBtn').addEventListener('click', () => {
        window.location.href = 'https://qrwale.in/';
    });

    document.getElementById('generate-bill').addEventListener('click', () => {
        const totalAmount = document.getElementById('total').innerText.split('₹')[1];
        if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
            alert('Please set up your UPI details first.');
            return;
        }

        const upiUrl = `upi://pay?pa=${upiDetails.upiId}&pn=${upiDetails.name}&am=${totalAmount}&cu=INR&tn=${upiDetails.note}`;
        const qrCode = new QRCodeStyling({
            width: 300,
            height: 300,
            data: upiUrl,
            dotsOptions: { color: "#000", type: "rounded" },
            backgroundOptions: { color: "#fff" }
        });

        document.getElementById('bill-qr-code').innerHTML = "";
        qrCode.append(document.getElementById('bill-qr-code'));

        billHistory.push({
            date: new Date().toLocaleString(),
            items: [...cart],
            total: totalAmount
        });
        saveToLocalStorage('billHistory', billHistory);

        alert('Total Bill: ₹' + totalAmount);
        printBill();
        cart = [];
        displayCart();
    });

    document.getElementById('qrForm').addEventListener('submit', function(e) {
        e.preventDefault();
        upiDetails = {
            upiId: document.getElementById('upi_id').value,
            name: document.getElementById('name').value,
            note: document.getElementById('note').value
        };
        saveToLocalStorage('upiDetails', upiDetails);
        alert('UPI details saved.');
    });

    document.getElementById('download-data').addEventListener('click', () => {
        const data = { productDetails, cart, upiDetails };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('upload-data').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = JSON.parse(e.target.result);
                if (data.productDetails) productDetails = data.productDetails;
                if (data.cart) cart = data.cart;
                if (data.upiDetails) upiDetails = data.upiDetails;
                saveToLocalStorage('productDetails', productDetails);
                saveToLocalStorage('upiDetails', upiDetails);
                alert('Data imported successfully.');
            };
            reader.readAsText(file);
        }
    });

    document.getElementById('option5-button').addEventListener('click', () => {
        const billHistoryContainer = document.getElementById('bill-history');
        billHistoryContainer.innerHTML = '';
        if (billHistory.length > 0) {
            billHistory.forEach((bill, index) => {
                let itemsList = '';
                bill.items.forEach(item => {
                    const product = productDetails[item.code];
                    itemsList += `${product.name} (x${item.quantity}) - ₹${product.price * item.quantity}<br>`;
                });
                billHistoryContainer.innerHTML += `
                    <div class="bill-entry">
                        <strong>Bill ${index + 1} - ${bill.date}</strong><br>
                        ${itemsList}
                        <strong>Total: ₹${bill.total}</strong>
                    </div><hr>`;
            });
        } else {
            billHistoryContainer.innerHTML = '<p>No bill history available.</p>';
        }
    });

    function displayCart() {
        const cartDiv = document.getElementById('cart');
        cartDiv.innerHTML = '';
        cart.forEach((item, index) => {
            const product = productDetails[item.code];
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `${product.name} - ₹${product.price} (x${item.quantity})`;
            cartDiv.appendChild(itemDiv);
        });
        calculateTotal();
    }

    function calculateTotal() {
        let total = cart.reduce((sum, item) => sum + (productDetails[item.code].price * item.quantity), 0);
        document.getElementById('total').innerText = `Total: ₹${total}`;
    }
});
