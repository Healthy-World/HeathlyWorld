var data = [{
        "id": 345,
        "match": '93%',
        "name": "Dr. Bowen Chan",
        "gender": "M",
        "image": "/img/doctors/chan_small.jpg",
        "availability" : {
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
            "postal": "M6G 1Y6",
            "gps": {
                "lat": 43.6728208,
                "long": -79.4150052
            }
        },
        "reviews": [
            {
                "name": "",
                "rating": 5,
                "comments": "Very good doctor.",
                "attributes": {
                    "staff": 5,
                    "punctual": 5,
                    "helpful": 5,
                    "knowledge": 5
                }
            },
            {
                "name": "",
                "rating": 5,
                "comments": "They are particularly wonderful with my baby daughter",
                "attributes": {
                    "staff": 5,
                    "punctual": 5,
                    "helpful": 5,
                    "knowledge": 5
                }
            },
            {
                "name": "",
                "rating": 4.75,
                "comments": "Awesome doc that really knows his stuff.",
                "attributes": {
                    "staff": 5,
                    "punctual": 4,
                    "helpful": 5,
                    "knowledge": 5
                }
            },
            {
                "name": "",
                "rating": 3.75,
                "comments": "We had to find a new Dr. with the sudden passing of ours. Dr. Chan & his Associates are very caring.",
                "attributes": {
                    "staff": 3,
                    "punctual": 4,
                    "helpful": 5,
                    "knowledge": 3
                }
            }
        ]
    },
    {
        "id": 564,
        "match": '92%',
        "name": "Dr. Michael Lewis BSc, MD, CCFP",
        "gender": "M",
        "image": "/img/doctors/Michael_Lewis_small.jpg",
        "availability" : {
            "Monday": "9am - 5pm",
            "Tuesday": "9am - 12pm",
            "Friday": "9am - 12pm"
        },
        "phone": "416-486-1956",
        "address": {
            "street": "200 St. Clair Ave. West Suite 110",
            "city": "Toronto",
            "prov": "ON",
            "postal": "M4V 1R1",
            "gps": {
                "lat": 43.6866184,
                "long": -79.4025450
            }
        },
        "reviews": [
            {
                "name": "",
                "rating": 2.5,
                "comments": "Dr. Lewis is good, but the person whop answers the phone and who you depend on to get an appointment, keep track of information, etc, is terrible. Her command of the english language isn't great, and results in a LOT of errors.",
                "attributes": {
                    "staff": 1,
                    "punctual": 2,
                    "helpful": 3,
                    "knowledge": 4
                }
            }
        ]
    },
    {
        "id": 675,
        "match": '91%',
        "name": "Dr. Sharon Hind BScH, MD, CCFP",
        "gender": "F",
        "image": "/img/doctors/sharonwelch_small.jpg",
        "availability" : {
            "Monday": "10am - 2pm",
            "Tuesday": "11am - 5pm",
            "Wednesday": "10am - 5pm"
        },
        "phone": "416-486-1956",
        "address": {
            "street": "200 St. Clair Ave. West Suite 110",
            "city": "Toronto",
            "prov": "ON",
            "postal": "M4V 1R1",
            "gps": {
                "lat": 43.6866184,
                "long": -79.4025450
            }
        },
        "reviews": [
            {
                "name": "",
                "rating": 5,
                "comments": "",
                "attributes": {
                    "staff": 5,
                    "punctual": 5,
                    "helpful": 5,
                    "knowledge": 5
                }
            },
            {
                "name": "",
                "rating": 4.75,
                "comments": "",
                "attributes": {
                    "staff": 5,
                    "punctual": 5,
                    "helpful": 5,
                    "knowledge": 4
                }
            },
            {
                "name": "",
                "rating": 4.75,
                "comments": "very caring and attentive",
                "attributes": {
                    "staff": 4,
                    "punctual": 5,
                    "helpful": 5,
                    "knowledge": 5
                }
            },
            {
                "name": "",
                "rating": 4.75,
                "comments": "",
                "attributes": {
                    "staff": 4,
                    "punctual": 5,
                    "helpful": 5,
                    "knowledge": 3
                }
            }
        ]
    },
    {
        "id": 152,
        "match": '89%',
        "name": "Dr. Sheeja Mathai",
        "gender": "F",
        "image": "/img/doctors/drmathai_small.jpg",
        "availability" : {
        },
        "phone": "647-722-2370",
        "address": {
            "street": "390 Steeles Avenue West",
            "city": "Vaughan",
            "prov": "ON",
            "postal": "L4J",
            "gps": {
                "lat": 43.7950938,
                "long": -79.4338563
            }
        },
        "reviews": []
    },
    {
        "id": 222,
        "match": '85%',
        "name": "Dr. Preston Tran",
        "gender": "M",
        "image": "/img/doctors/TranTriet_small.jpg",
        "phone": "647-722-2370",
        "address": {
            "street": "390 Steeles Avenue West",
            "city": "Vaughan",
            "prov": "ON",
            "postal": "L4J",
            "gps": {
                "lat": 43.7950938,
                "long": -79.4338563
            }
        },
        "reviews": [
            {
                "name": "",
                "rating": 4.5,
                "comments": "Wonderful doctor: respectful, skillful, thorough, takes time, cares. ",
                "attributes": {
                    "staff": 4,
                    "punctual": 4,
                    "helpful": 5,
                    "knowledge": 5
                }
            }
        ]
    }

];

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