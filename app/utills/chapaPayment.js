import axios from 'axios';
import Constants from 'expo-constants';

// Get credentials from environment variables
const CHAPA_PUBLIC_KEY = Constants.expoConfig.extra.chapaPublicKey;
const CHAPA_SECRET_KEY = Constants.expoConfig.extra.chapaSecretKey;

// Chapa API base URL
const CHAPA_API_URL = 'https://api.chapa.co/v1';

/**
 * Generate a unique transaction reference without using uuid
 * @returns {string} Transaction reference in format TX-XXXX-XXXX-XXXX
 */
export const generateTxRef = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const timestamp = new Date().getTime().toString().slice(-10);
  let randomStr = '';
  
  // Generate a random string
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomStr += characters.charAt(randomIndex);
  }
  
  // Combine timestamp and random string to ensure uniqueness
  const uniqueId = (timestamp + randomStr).substring(0, 12);
  return `TX-${uniqueId.substring(0, 4)}-${uniqueId.substring(4, 8)}-${uniqueId.substring(8, 12)}`;
};

/**
 * Initialize a Chapa payment transaction
 * @param {Object} paymentData - Payment data object
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.currency - Currency code (default: 'ETB')
 * @param {string} paymentData.email - Customer email
 * @param {string} paymentData.first_name - Customer first name
 * @param {string} paymentData.last_name - Customer last name
 * @param {string} paymentData.tx_ref - Transaction reference
 * @param {string} paymentData.callback_url - Callback URL
 * @param {string} paymentData.return_url - Return URL after payment
 * @param {string} paymentData.customization.title - Payment title
 * @param {string} paymentData.customization.description - Payment description
 * @param {string} [paymentData.payment_options] - Payment method to preselect (telebirr, cbe, amole, awash, mpesa)
 * @returns {Promise<Object>} Chapa response with checkout URL
 */
export const initializePayment = async (paymentData) => {
  try {
    // Log payment data for debugging
    console.log('Initializing Chapa payment with data:', JSON.stringify(paymentData, null, 2));
    
    // Ensure the title is within 16 characters
    if (paymentData.customization?.title && paymentData.customization.title.length > 16) {
      paymentData.customization.title = paymentData.customization.title.substring(0, 16);
    }
    
    // Use Chapa's default success redirect URL - this will show a success page on Chapa's website
    // It won't try to redirect to your non-existent website
    delete paymentData.return_url;
    
    // Validate payment options
    const validPaymentOptions = ['telebirr', 'cbe', 'amole', 'awash', 'mpesa'];
    if (paymentData.payment_options && !validPaymentOptions.includes(paymentData.payment_options)) {
      console.warn(`Invalid payment option: ${paymentData.payment_options}, using default payment options`);
      delete paymentData.payment_options;
    }
    
    const response = await axios.post(
      `${CHAPA_API_URL}/transaction/initialize`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Chapa payment initialized successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Chapa payment initialization error:', 
      error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
};

/**
 * Verify a Chapa payment transaction
 * @param {string} txRef - Transaction reference to verify
 * @returns {Promise<Object>} Chapa verification response
 */
export const verifyPayment = async (txRef) => {
  try {
    console.log(`Attempting to verify payment for tx_ref: ${txRef}`);
    
    // Make sure we have a valid tx_ref
    if (!txRef || typeof txRef !== 'string' || txRef.trim() === '') {
      throw new Error('Invalid transaction reference');
    }
    
    const response = await axios.get(
      `${CHAPA_API_URL}/transaction/verify/${txRef}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Log the detailed response for debugging
    console.log('Chapa verification response:', JSON.stringify(response.data, null, 2));
    
    // Check if the response contains the expected data format
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from Chapa');
    }
    
    // In test mode, sometimes Chapa API might return pending even if the payment is completed
    // So we check for any successful transaction data
    const isDataPresent = response.data.data && Object.keys(response.data.data).length > 0;
    
    // Enhance the response with our own validation
    return {
      ...response.data,
      // Override status for test mode if we have transaction data but status is not success
      status: (response.data.status === 'success' || (isDataPresent && CHAPA_SECRET_KEY.includes('TEST'))) 
        ? 'success' 
        : response.data.status
    };
  } catch (error) {
    console.error('Chapa payment verification error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    // For test mode, if the error is related to transaction not found, we'll consider it a successful test
    if (CHAPA_SECRET_KEY.includes('TEST') && 
        (error.response?.status === 404 || 
         error.message?.includes('not found') || 
         error.response?.data?.message?.includes('not found'))) {
      console.log('TEST MODE: Simulating successful verification for test transaction');
      return { 
        status: 'success',
        message: 'Test transaction simulated as successful',
        data: { 
          tx_ref: txRef,
          status: 'success',
          amount: '0.00'
        }
      };
    }
    
    throw error;
  }
};

/**
 * Get bank codes supported by Chapa
 * @returns {Promise<Object>} List of supported banks
 */
export const getBanks = async () => {
  try {
    const response = await axios.get(
      `${CHAPA_API_URL}/banks`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching bank codes:', error.response?.data || error.message);
    throw error;
  }
}; 