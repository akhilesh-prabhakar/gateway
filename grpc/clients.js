const fs = require('fs');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

function loadProto(protoFile, packageName) {
  const packageDefinition = protoLoader.loadSync(protoFile, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const loaded = grpc.loadPackageDefinition(packageDefinition);
  return loaded[packageName];
}

function resolveProtoPath(fileName) {
  const candidates = [
    process.env.PROTO_ROOT,
    path.join(__dirname, '..', '..', 'proto'),
    path.join(__dirname, '..', 'proto'),
  ].filter(Boolean);

  for (const root of candidates) {
    const fullPath = path.join(root, fileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  const searched = candidates.map((root) => path.join(root, fileName)).join(', ');
  throw new Error(`Proto file not found: ${fileName}. Searched: ${searched}`);
}

const productProto = loadProto(resolveProtoPath('product.proto'), 'product');
const orderProto = loadProto(resolveProtoPath('order.proto'), 'order');

const productClient = new productProto.ProductService(
  process.env.PRODUCT_SERVICE_URL || '127.0.0.1:5001',
  grpc.credentials.createInsecure(),
);

const orderClient = new orderProto.OrderService(
  process.env.ORDER_SERVICE_URL || '127.0.0.1:5002',
  grpc.credentials.createInsecure(),
);

function grpcUnary(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    });
  });
}

module.exports = {
  productClient,
  orderClient,
  grpcUnary,
  grpc,
};
