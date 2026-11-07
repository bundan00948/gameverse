export function purchaseTotal(price: number, quantity: number): number {
  return price * quantity;
}
export function validQuantity(quantity: number): boolean {
  return Number.isSafeInteger(quantity) && quantity >= 1;
}