const promise = require('bluebird');
const co = require('co');
const path = require('path');
const grpc = require('grpc');
const PROTO_PATH = path.join(__dirname, '/article.proto');
const Client = grpc.load(PROTO_PATH).article;
const fs = require('fs');

const getAuthCred = function() {
  // return grpc.credentials.createInsecure();
  return grpc.credentials.createFromMetadataGenerator(function(auth_context, callback) {
    var metadata = new grpc.Metadata();
    metadata.add('authorization', 'ok');
    callback(null, metadata);
  });
}


const getClient = function (address) {
  let creds = grpc.credentials.combineChannelCredentials(
    grpc.credentials.createSsl(fs.readFileSync('certs/cert.pem')),
    getAuthCred()
  );
  // return new Client(address, grpc.credentials.createInsecure());
  return new Client(address, creds);
};


function main() {
  const articleClient = getClient('test.fr:50051');

  // insert
  articleClient.insert({
    content: 'This is your article5',
    title: 'article title',
    isPublic: true,
    url: 'article-title',
    cover: 'xxxxxx.jpg'
  }, function (err, res) {
    if (err) {
      return console.log(err);
    }
    console.log('Insert success');
    return console.log(res);
  })


  // get by id
  articleClient.getById({id: '1'}, function(err, res) {
    if (err) {
      return console.log(err);
    }
    console.log('Get by id 1:');
    console.log(res);
  });


  // update
  articleClient.update({
    id: '1',
    content: 'This is a test',
    title: 'article title',
    isPublic: true,
    url: 'article-title',
    cover: 'xxxxxx.jpg'
  }, function (err, res) {
    if (err) {
      return console.log(err);
    }
    console.log('update article id 1');
    return console.log(res);
  });


  // get list
  articleClient.getList({}, function (err, res) {
    if (err) {
      return console.log(err);
    }
    console.log('article list: ')
    return console.log(res.articles);
  })

  let stream = articleClient.testStreaming({});
  stream.on('data', (data) => {
    console.log("Get data => ", data);
  });

}



main();
