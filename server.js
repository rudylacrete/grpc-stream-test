const grpc = require('grpc');
const path = require('path');
const PROTO_PATH = path.join(__dirname, '/article.proto');
const article = grpc.load(PROTO_PATH).article;
let db = require('./db.json');
const fs = require('fs');

class Article {
  getList (call, callback) {
    console.log('call metadata =>', call.metadata);
    return callback(null, {
      articles: db
    })
  }
  getById (call, callback) {
    for (var i = 0; i < db.length; i++) {
      if (db[i].id === call.request.id) {
        return callback(null, db[i]);
      }
    }
    return callback('Can not find article.');
  }
  insert (call, callback) {
    let newArticle = Object.assign({}, call.request);
    newArticle.id = (db.length + 1) + '';
    db.push(newArticle);
    return callback(null, newArticle);
  }
  update (call, callback) {
    if (!call.request.id) {
      return callback('Article id can not find.');
    }
    for( var i = 0; i < db.length; i++) {
      if (db[i].id === call.request.id) {
        const newArticle = Object.assign(db[i], call.request);
        db.splice(i, 1, newArticle);
        return callback(null, newArticle);
      }
    }
    return callback('Can not find article.');
  }
  remove (call, callback) {
    if (!call.request.id) {
      return callback('Article id can not find.');
    }
    for( var i = 0; i < db.length; i++) {
      if (db[i].id === call.request.id) {
        db.splice(i, 1);
        return callback(null);
      }
    }
    return callback('Can not find article.');
  }
  testStreaming(call) {
    if(call.metadata.get('authorization') != 'ok')
      call.end();
    let interval = setInterval(() => {
      console.log('writing data ...');
      call.write(db[0]);
    }, 2000);
    call.on('end', () => {
      console.log('Stream ended by client ....');
      clearInterval(interval);
    });

    call.on('error', (error) => {
      clearInterval(interval);
      call.end();
      console.log('error//// ', error);
      console.log(error.code);
    });
  }
}

const getServer = function (service, serviceCall, lintener) {
  const server = new grpc.Server();
  server.addService(service, serviceCall);
  // server.bind(lintener, grpc.ServerCredentials.createInsecure());
  server.bind(lintener, grpc.ServerCredentials.createSsl(null, [{
    cert_chain: fs.readFileSync('certs/cert.pem'),
    private_key: fs.readFileSync('certs/key.pem')
  }], false));
  return server;
}

const articleServer = getServer(article.service, new Article(), '0.0.0.0:50051');
articleServer.start();