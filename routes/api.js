/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(function (req,res){
        var board = req.params.board;   
         MongoClient.connect(MONGODB_CONNECTION_STRING,function(err, client) {
          var dbCollection = client.db('anonymous-message-board').collection(board);
         dbCollection.find({},
         {
         reported: 0,
          delete_password: 0,
          "replies.delete_password": 0,
          "replies.reported": 0
         })
           .sort({bumped_on: -1})
           .limit(10)
           .toArray((err,result)=>{
           if(err) console.log(err)
           console.log('result',result);
           res.json(result).end();
         })
        });
      })
  .post(function (req,res){
        var board = req.params.board;
        var thread = {
            text: req.body.text,
            created_on: new Date(),
            bumped_on: new Date(),
            reported: false,
            delete_password: req.body.delete_password,
            replies: []
        };
         MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, client) {
          var db = client.db('anonymous-message-board');
          db.collection(board).insertOne(thread,function(err,doc){
            if (err) console.log(err)
            // res.json(thread);
             res.redirect('/b/'+board+'/');
          });
        });
      })
  .put(function (req,res){
        var board = req.params.board;
        var threadToFind = {
          board:req.body.board,
          _id: new ObjectId(req.body.thread_id),
        }
        console.log('threadToFind',req.body)
      
         MongoClient.connect(MONGODB_CONNECTION_STRING ,function(err, client) {
             var dbCollection = client.db('anonymous-message-board').collection(board);
           dbCollection.findOneAndUpdate({ "_id": threadToFind._id}, {$set: {"reported":true}}, {new: true},function(err,doc) {
                 if (err) { throw err; }
                 else { console.log("Updated"); }
               }); 
             })
    res.send('reported')
      })
  .delete(function (req,res){
        var board = req.params.board;
        var threadToFind = {
          _id: new ObjectId(req.body.thread_id),
          delete_password: req.body.delete_password
        }
        console.log('req.body',req.body)
        MongoClient.connect(MONGODB_CONNECTION_STRING,function(err, client) {
           var dbCollection = client.db('anonymous-message-board').collection(board);
           dbCollection.findOneAndDelete(threadToFind,function(err,doc){
             if(err)throw err;
             console.log('successfully deleted',doc)
             res.send("delete successful");
             })
           })
      });
    
  app.route('/api/replies/:board')
  .get(function (req,res){
        var board = req.params.board;
         MongoClient.connect(MONGODB_CONNECTION_STRING,function(err, client) {
          var dbCollection = client.db('anonymous-message-board').collection(board);
         dbCollection.find({_id:new ObjectId(req.query.thread_id)},
         {
         reported: 0,
          delete_password: 0,
          "replies.delete_password": 0,
          "replies.reported": 0
         }).toArray((err,result)=>{
           if(err) console.log(err)
           console.log('result',result);
           res.json(result[0]).end();
         })
        });
      })
  .post(function (req,res){
        var board = req.params.board;
        var reply = {
          _id: new ObjectId(),
          text: req.body.text,
          created_on: new Date(),
          reported: false,
          delete_password: req.body.delete_password,
        };
    
    console.log('reply',reply)
        MongoClient.connect(MONGODB_CONNECTION_STRING ,function(err, client) {
             var dbCollection = client.db('anonymous-message-board').collection(board);
             dbCollection.findOneAndUpdate({ "_id": req.body.thread_id}, [],{$set: {bumped_on: new Date()},
          $push: { replies: reply  }}, function(err,doc) {
                 if (err) { throw err; }
                 else { console.log("reply posted"); }
              }); 
        })
        res.redirect('/b/'+board+'/'+req.body.thread_id);
      })
  .put(function (req,res){
        var board = req.params.board;
         MongoClient.connect(MONGODB_CONNECTION_STRING ,function(err, client) {
         var dbCollection = client.db('anonymous-message-board').collection(board);    
        dbCollection.findAndModify(
        {
          _id: new ObjectId(req.body.thread_id),
          "replies._id": new ObjectId(req.body.reply_id)
        },
        [],
        { $set: { "replies.$.reported": true } },
        function(err, doc) {
        });
      })
    })
  .delete(function (req,res){
        var board = req.params.board;
      });

};
