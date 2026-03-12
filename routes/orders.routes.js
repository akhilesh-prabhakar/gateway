const express = require('express');
const { orderClient, grpcUnary } = require('../grpc/clients');
const { handleGrpcError } = require('../utils/grpc');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const response = await grpcUnary(orderClient, 'ListOrders', {});
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const response = await grpcUnary(orderClient, 'GetOrder', {
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
      productId: req.body.productId,
      quantity: Number(req.body.quantity),
    };
    const response = await grpcUnary(orderClient, 'CreateOrder', payload);
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = {
      id: req.params.id,
      productId: req.body.productId,
      quantity: Number(req.body.quantity),
      status: req.body.status,
    };
    const response = await grpcUnary(orderClient, 'UpdateOrder', payload);
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const response = await grpcUnary(orderClient, 'DeleteOrder', {
      id: req.params.id,
    });
    return res.json(response);
  } catch (error) {
    return handleGrpcError(res, error);
  }
});

module.exports = router;
