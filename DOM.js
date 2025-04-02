// Load medicines from the local medicine.json file
const loadMedicine = async (searchText = '', isShowAll = false) => {
    const res = await fetch('medicine.json');
    const data = await res.json();
    let medicines = data;

    // Filter medicines based on the search text
    if (searchText) {
        medicines = medicines.filter(med => 
            med.medicine_name.toLowerCase().includes(searchText.toLowerCase())
        );
    }

    // Show no result if there are no matching medicines
    if (medicines.length === 0) {
        noResult();
    } else {
        displayMedicines(medicines, isShowAll);
    }
};

// Display medicines
const displayMedicines = (medicines, isShowAll) => {
    const medicineContainer = document.getElementById('medicine-container');
    medicineContainer.textContent = '';

    const showAllContainer = document.getElementById('show-all-container');
    if (medicines.length > 9 && !isShowAll) {
        showAllContainer.classList.remove('hidden');
    } else {
        showAllContainer.classList.add('hidden');
    }

    // Display only the first 9 medicines if not showing all
    if (!isShowAll) {
        medicines = medicines.slice(0, 9);
    }

    medicines.forEach(medicine => {
        const medicineCard = document.createElement('div');
        medicineCard.classList = 'card bg-gray-100 p-4 shadow-xl';
        medicineCard.innerHTML = `
        <figure><img src="${medicine.images}" alt="${medicine.medicine_name}" /></figure>
        <div class="card-body">
            <h2 class="card-title"><b>${medicine.medicine_name}</b></h2>
            <p><b>Manufacturer:</b> ${medicine.manufacturer}</p>
            <div class="card-actions justify-center">
                <button onclick="handleShowDetail('${medicine.id}')" class="btn btn-primary"><b>Show Details</b></button>
            </div>
        </div>
        `;
        medicineContainer.appendChild(medicineCard);
    });

    toggleLoadingSpinner(false);
};

// Handle showing medicine details
const handleShowDetail = (id) => {
    fetch('./medicine.json')
        .then(response => response.json())
        .then(data => {
            const medicine = data.find(med => med.id === id); // Match based on id
            if (medicine) {
                showMedicineDetails(medicine);
            } else {
                console.error('Medicine not found for ID:', id);
            }
        })
        .catch(error => console.error('Error fetching medicine data:', error));
};

// Display medicine details in the modal
const showMedicineDetails = (medicine) => {
    const medicineName = document.getElementById('medicine-name');
    medicineName.innerText = medicine.name;
    
    const showDetailContainer = document.getElementById('show-detail-container');
    showDetailContainer.innerHTML = `
        <img src="${medicine.images}" alt="${medicine.name}" class="justify-center" />
        <p><span><b>Manufacturer:</b> </span>${medicine.manufacturer}</p>
        <p><span><b>Instructions:</b> </span>${medicine.usageinstruction}</p>
        <p><span><b>Description:</b> </span>${medicine.description}</p>
        <p><span><b>Indication:</b> </span>${medicine.indication}</p>

        <p><span><b>Side Effects:</b> </span>${medicine.sideeffects}</p>
        <p><span><b>Child Dose:</b> </span>${medicine.childdose}</p>

        <p><span><b>Adult Dose:</b> </span>${medicine.adultdose}</p>
        <p><span><b>Contraindication:</b> </span>${medicine.contraindication}</p>
    `;

    // Show the modal
    if (show_details_modal) {
        // If it's a <dialog> element, use showModal
        if (typeof show_details_modal.showModal === 'function') {
            show_details_modal.showModal();
        } else {
            // If it's a <div>, manually show the modal (e.g., with CSS)
            show_details_modal.classList.add('show'); // Assuming "show" is a CSS class that makes the modal visible
        }
    } else {
        console.error("Modal element not found!");
    }
};

// Handle search
const handleSearch = (isShowAll) => {
    toggleLoadingSpinner(true);
    const searchField = document.getElementById('search-field');
    const searchText = searchField.value;
    loadMedicine(searchText, isShowAll);
};

// Toggle loading spinner
const toggleLoadingSpinner = (isLoading) => {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
};

// Handle showing all medicines
const handleShowAll = () => {
    handleSearch(true);
};

// Display no result message
const noResult = () => {
    const resultNone = document.getElementById('none-result-container');
    resultNone.innerHTML = `
       <h2>Opssss!!!!!!</h2>
       <p>There is no medicine with that name.</p>
    `;
    noneResult.showModal();
};

// Initial load of medicines
loadMedicine();
