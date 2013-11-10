var data = [{
    id: 2342,
    "name": "Dr. Bowen Chan",
    "gender": "M",
    coords:
    {
        lat: 43.650284,
         lng: -79.384301
    },
    "image": "https://education.kennesaw.edu/edleadership/sites/education.kennesaw.edu.edleadership/files/chan.jpg",
    "availability": {
        "Monday": "8:30am - 5:30pm",
        "Wednesday": "1:30pm - 7:30pm",
        "Thrusday": "10am - 8pm",
        "Friday": "9am - 12pm"
    },
    "phone": "416-486-1956",
    "address": {
        "street": "473 Dupont Street",
        "city": "Toronto",
        "prov": "ON",
        "postal": "M6G 1Y6"
    },
    "reviews": [{
        "name": "",
        "rating": 5,
        "comments": "Very good doctor.",
        "attributes": {
            "staff": 5,
            "punctual": 5,
            "helpful": 5,
            "knowledge": 5
        }
    }, {
        "name": "",
        "rating": 5,
        "comments": "They are particularly wonderful with my baby daughter",
        "attributes": {
            "staff": 5,
            "punctual": 5,
            "helpful": 5,
            "knowledge": 5
        }
    }, {
        "name": "",
        "rating": 4.75,
        "comments": "Awesome doc that really knows his stuff.",
        "attributes": {
            "staff": 5,
            "punctual": 4,
            "helpful": 5,
            "knowledge": 5
        }
    }, {
        "name": "",
        "rating": 3.75,
        "comments": "We had to find a new Dr. with the sudden passing of ours. Dr. Chan & his Associates are very caring.",
        "attributes": {
            "staff": 3,
            "punctual": 4,
            "helpful": 5,
            "knowledge": 3
        }
    }]
}, {
    id: 453,
    "name": "Dr. Michael Lewis BSc, MD, CCFP",
    "gender": "M",
    "image": "http://stemmedcancer.com/wp-content/uploads/2011/10/Michael_Lewis-e1319515460190.jpg",
    "availability": {
        "Monday": "9am - 5pm",
        "Tuesday": "9am - 12pm",
        "Friday": "9am - 12pm"
    },
    "phone": "416-486-1956",
    "address": {
        "street": "200 St. Clair Ave. West Suite 110",
        "city": "Toronto",
        "prov": "ON",
        "postal": "M4V 1R1"
    },
    "reviews": [{
        "name": "",
        "rating": 2.5,
        "comments": "Dr. Lewis is good, but the person whop answers the phone and who you depend on to get an appointment, keep track of information, etc, is terrible. Her command of the english language isn't great, and results in a LOT of errors.",
        "attributes": {
            "staff": 1,
            "punctual": 2,
            "helpful": 3,
            "knowledge": 4
        }
    }]
}, {
    id: 565,
    "name": "Dr. Sharon Hind BScH, MD, CCFP",
    "gender": "F",
    "image": "http://nonprophetstatus.files.wordpress.com/2010/02/sharonwelch.jpg",
    "availability": {
        "Monday": "10am - 2pm",
        "Tuesday": "11am - 5pm",
        "Wednesday": "10am - 5pm"
    },
    "phone": "416-486-1956",
    "address": {
        "street": "200 St. Clair Ave. West Suite 110",
        "city": "Toronto",
        "prov": "ON",
        "postal": "M4V 1R1"
    },
    "reviews": [{
        "name": "",
        "rating": 5,
        "comments": "",
        "attributes": {
            "staff": 5,
            "punctual": 5,
            "helpful": 5,
            "knowledge": 5
        }
    }, {
        "name": "",
        "rating": 4.75,
        "comments": "",
        "attributes": {
            "staff": 5,
            "punctual": 5,
            "helpful": 5,
            "knowledge": 4
        }
    }, {
        "name": "",
        "rating": 4.75,
        "comments": "very caring and attentive",
        "attributes": {
            "staff": 4,
            "punctual": 5,
            "helpful": 5,
            "knowledge": 5
        }
    }, {
        "name": "",
        "rating": 4.75,
        "comments": "",
        "attributes": {
            "staff": 4,
            "punctual": 5,
            "helpful": 5,
            "knowledge": 3
        }
    }]
}, {
    id: 676,
    "name": "Dr. Sheeja Mathai",
    "gender": "F",
    "image": "http://www.soukya.com/images/drmathai2008.jpg",
    "availability": {},
    "phone": "647-722-2370",
    "address": {
        "street": "390 Steeles Avenue West",
        "city": "Vaughan",
        "prov": "ON",
        "postal": "L4J"
    },
    "reviews": []
}, {
    id: 5675,
    "name": "Dr. Preston Tran",
    "gender": "M",
    "image": "http://blogs.worldbank.org/files/dmblog/Dr_%20Tran%20Triet.JPG",
    "phone": "647-722-2370",
    "address": {
        "street": "390 Steeles Avenue West",
        "city": "Vaughan",
        "prov": "ON",
        "postal": "L4J"
    },
    "reviews": [{
        "name": "",
        "rating": 4.5,
        "comments": "Wonderful doctor: respectful, skillful, thorough, takes time, cares. ",
        "attributes": {
            "staff": 4,
            "punctual": 4,
            "helpful": 5,
            "knowledge": 5
        }
    }]
}];

function findDoctorById(id) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].id == id)
            return data[i];
    }

    return {};
}

exports.getDoctors = function(req, res) {
    res.json(data);
};

exports.getDoctor = function(req, res) {
    res.json(findDoctorById(req.params.id));
};