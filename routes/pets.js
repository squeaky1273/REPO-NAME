// MODELS
const Pet = require('../models/pet');

// MAILER MODULE
const mailer = require('../utils/mailer');

// PET ROUTES
module.exports = (app) => {

  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', (req, res) => {
    var pet = new Pet(req.body);

    pet.save()
      .then((pet) => {
        res.redirect(`/pets/${pet._id}`);
      })
      .catch((err) => {
        // Handle Errors
      }) ;
  });

  // SHOW PET
  app.get('/pets/:id', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-show', { pet: pet });
    });
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-edit', { pet: pet });
    });
  });

  // UPDATE PET
  app.put('/pets/:id', (req, res) => {
    Pet.findByIdAndUpdate(req.params.id, req.body)
      .then((pet) => {
        res.redirect(`/pets/${pet._id}`)
      })
      .catch((err) => {
        // Handle Errors
        console.log('Update pet error: ', err);
      });
  });

  // DELETE PET
  app.delete('/pets/:id', (req, res) => {
    Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
      return res.redirect('/')
    });
  });

  // PURCHASE PET
  app.post('/pets/:id/purchase', (req, res) => {
    var stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);
    const token = req.body.stripeToken;
    let petId = req.body.petId || req.params.id;

    Pet.findById(petId).exec((err, pet) => {
      if (err) {
        console.log('Error: ', err);
        res.redirect(`pets/${req.params.id}`);
      }     
      const charge = stripe.charges.create({
        amount: pet.price * 100,
        currency: 'usd',
        description: `Purchased ${pet.name}, ${pet.species}`,
        source: token,
      }).then((chg) => {
        const user = {
          email: req.body.stripeEmail,
          amount: chg.amount / 100,
          petName: pet.name
        };
        mailer.sendMail(user, req, res);
        res.redirect(`/pets/${req.params.id}`);
      })
      .catch(err => {
        console.log('Error: ', err);
      });
    });
  });

  // Search Pet
  app.get('/search', (req, res) => {
    const term = new RegExp(req.query.term, 'i');
    const page = req.query.page || 1;

    Pet.paginate(
      {
        $or: [
          { 'name' : term },
          { 'species': term }
        ]
      },
      { page: page }).then((results) => {
        res.render('pets-index', { pets: results.docs, pagesCount: results.pages, currentPage: page, term: req.query.term });
      })
  });
}