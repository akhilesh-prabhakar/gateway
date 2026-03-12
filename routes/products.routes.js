const express = require('express');
const { productClient, grpcUnary } = require('../grpc/clients');
const { handleGrpcError } = require('../utils/grpc');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const response = await grpcUnary(productClient, 'ListProducts', {});
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const response = await grpcUnary(productClient, 'GetProduct', {
      id: req.params.id,
    });
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
    };
    const response = await grpcUnary(productClient, 'CreateProduct', payload);
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = {
      id: req.params.id,
      name: req.body.name,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
    };
    const response = await grpcUnary(productClient, 'UpdateProduct', payload);
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const response = await grpcUnary(productClient, 'DeleteProduct', {
      id: req.params.id,
    });
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

module.exports = router;
