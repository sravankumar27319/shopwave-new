import { z } from 'zod';

// Schema for adding an item to the cart
export const addCartItemSchema = z.object({
  productId: z.string().nonempty({ message: 'Product ID is required' }),
  quantity: z
    .number({ error: 'Quantity must be a number' })
    .int({ error: 'Quantity must be an integer' })
    .positive({ error: 'Quantity must be greater than zero' }),
});

// Schema for updating the quantity of an existing cart item
export const updateCartItemSchema = z.object({
  quantity: z
    .number({ error: 'Quantity must be a number' })
    .int({ error: 'Quantity must be an integer' })
    .positive({ error: 'Quantity must be greater than zero' }),
});
