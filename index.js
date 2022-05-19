const express = require("express");
const cors = require("cors");

const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cofp3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    console.log("db connected");
    const serviceCollection = client
      .db("doctors_portal")
      .collection("services");
    const bookingCollection = client.db("doctors_portal").collection("booking");
    const userCollection = client.db("doctors_portal").collection("user");

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {
        email: email,
      };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          user,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/service", async (req, res) => {
      const query = {};

      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/available", async (req, res) => {
      const date = req.query.date || "May 17, 2022";
      // console.log(date);
      //step :1 get all services
      const services = await serviceCollection.find().toArray();
      // console.log(services);
      // step 2: get the bookings of that date

      const query = {
        date: date,
      };
      console.log(query);
      const bookings = await bookingCollection.find(query).toArray();
      // console.log(bookings);
      // step 3: for each service,kichu ekta korba

      services.forEach((service) => {
        //step 4:,find bookings for that service

        const serviceBookings = bookings.filter(
          (book) => book.treatment === service.name
        );

        //step 5 select slots for service bookings

        const bookedSlots = serviceBookings.map((book) => book.slot);
        //step 6: Select slots that are not in booked slots

        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        // console.log(available);
        service.slots = available;
      });
      console.log(services);
      res.send(services);
    });
    app.get("/booking", async (req, res) => {
      const patient = req.query.patient;
      console.log(patient);
      const query = {
        patient: patient,
      };

      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });
    app.post("/booking", async (req, res) => {
      const booking = req.body;

      const query = {
        treatment: booking.treatment,
        patient: booking.patient,
      };

      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);

      return res.send({ success: true, result });
      res.send(result);
      // console.log(query);
      // const result = await bookingCollection.insertOne(booking);
    });
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
