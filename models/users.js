var MongoClient = require('mongodb').MongoClient,
  config = require('../config/config'),
  assert = require('assert');

var user = {
  getOne: function(condi, callback) {

    MongoClient.connect(config.databaseurl, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server");
      var collection = db.collection('users');
      collection.findOne(condi, function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          callback(doc);
        }

      });

    });
  },
  getAll: function(condi, callback) {
    MongoClient.connect(config.databaseurl, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server");
      var collection = db.collection('users');
      collection.find(condi).toArray(function(err, docs) {
        if (err) {
          console.log(err);
        } else {
          callback(docs);
        }

      });

    });
  },
  add: function(data) {
    MongoClient.connect(config.databaseurl, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server");
      // Get the documents collection 
      var collection = db.collection('users');
      var insertDocument = function(db, callback) {
        db.collection('users').insertOne({
          "room": data.room,
          "nickname": data.nickname
        }, function(err, result) {
          assert.equal(err, null);
          if (err) {
            console.log(err);
          } else {
            console.log("Inserted a document into the restaurants collection.");
          }

          callback(result);
        });
      };
      // Insert some documents 
      insertDocument(db, function() {
        db.close();
      });

    });
  }
}

module.exports = user;