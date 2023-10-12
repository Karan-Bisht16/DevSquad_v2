const errorDiv = document.querySelector("#error");
const options = document.querySelector("#option");
const eventDiv = document.querySelector("#eventDiv");

options.addEventListener('change', ()=>{
    if (options.value==='Food'){
        eventDiv.classList.remove('hidden');
    } else {
        eventDiv.classList.add('hidden');
    }
});

function reverseGeocode(postionString) {
    const coordinates = postionString.split('_');
    const lat = parseFloat(coordinates[0].trim());
    const lng = parseFloat(coordinates[1].trim());

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.display_name) {
            document.querySelector('#humanReadableAddress').textContent = data.display_name;
        } else {
            alert('Location not found');
        }
    })
    .catch(error => console.error('Error fetching URL:', error));
}

const locResultDiv = document.querySelector("#locResult");
const currLocRadio = document.querySelector("#currLoc");
const addrTextArea = document.querySelector("#addressTextArea");
currLocRadio.addEventListener('change', ()=>{
    addrTextArea.value = '';
    addrTextArea.required = false;
    if (document.querySelector("input[type=checkbox]:checked")){
        const currentPosition = currLocRadio.getAttribute('location');
        if (currentPosition===''){
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    document.querySelector("#lat").textContent = latitude;
                    document.querySelector("#lng").textContent = longitude;
                    reverseGeocode(latitude+'_'+longitude);
                    locResultDiv.classList.remove('hidden'); 
                    console.log('User location [just calc.]:', `Latitude: ${latitude}, Longitude: ${longitude}`);
                },
                (error) => {
                    alert('Please enable location');
                    currLocRadio.checked = false;
                });
        } else {
            reverseGeocode(currentPosition);
            const postionArr = currentPosition.split('_');
            document.querySelector("#lat").textContent = postionArr[0].trim();
            document.querySelector("#lng").textContent = postionArr[1].trim();
            console.log('User location [via server]:', `Latitude: ${postionArr[0]}, Longitude: ${postionArr[1]}`);
            locResultDiv.classList.remove('hidden');
        }
    } else {
        locResultDiv.classList.add('hidden');
    }
});

addrTextArea.addEventListener('keyup',()=>{
    currLocRadio.checked = false;
    locResultDiv.classList.add('hidden');
    addrTextArea.required = true;
});

const coordinate = document.querySelector("#coordinates");
function geocode(humanReadableAddress) {
    const arrayOfAddress = humanReadableAddress.split(',');
    // console.log(arrayOfAddress);
    const len = arrayOfAddress.length;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${arrayOfAddress[len-2]}`;
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data && data.length > 0) {
            const result = data[0];
            coordinate.textContent = result.lat+'_'+result.lon;
        } else {
            console.log('No Lat, Lng');
        }
    })
    .catch(error => console.error('Error:', error));
}

async function imdone(formObject){
    const currentURL = window.location.href+'/submit';
        const response = await fetch(currentURL, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formObject)
        });
        const url = await response.json();
        if (url["error"]){
            errorDiv.textContent = url["error"];
            errorDiv.classList.remove('hidden');
            setTimeout(()=>{
                errorDiv.classList.add('hidden');
            },1000);
        } else {
            window.location.href = '/';
        }
}
const submitBtn = document.querySelector("#submitBtn");
submitBtn.addEventListener('click', (event)=>{
    event.preventDefault;
    formObject = {
        name: document.querySelector("#userName").value,
        dateOfDonation: document.querySelector("#dateOfDonation").value,
        mobileNumber: document.querySelector("#mobileNumber").value,
        typeOfDonation: options.value
    };
    if (options.value==='Food') {
        Object.assign(formObject, {typeOfEvent: document.querySelector("#eventType").value});
    }
    if (addrTextArea.value===''){
        currentPosition = {
            latitude: document.querySelector("#lat").textContent,
            longitude: document.querySelector("#lng").textContent
        };
        Object.assign(formObject, {position: {humanReadableAddress: document.querySelector('#humanReadableAddress').textContent, coordinates: currentPosition}});
    } else {
        geocode(addrTextArea.value);
        const addr = coordinate.innerHTML.split('_');
        const addrObj = {
            latitude: addr[0],
            longitude: addr[1]
        }
        console.log(addrObj);
        Object.assign(formObject, {position: {humanReadableAddress: addrTextArea.value, coordinates: addrObj}});
    }

    try {
        imdone(formObject);
    } catch (error) {
        console.error("Error in adding to server ",error);
        return false;
    }
});