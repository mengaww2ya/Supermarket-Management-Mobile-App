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
  if (!txRef) {
    console.error('verifyPayment: Transaction reference is required');
    return { status: 'failed', message: 'Transaction reference is required' };
  }

  console.log(`Starting verification for transaction: ${txRef}`);

  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20 second timeout for verification request (increased from 15s)
      }
    );

    console.log(`Verification response for ${txRef}:`, JSON.stringify(response.data, null, 2));

    // Validate successful response
    if (response.data && response.data.status === 'success') {
      // Check if the data object contains the verification data
      if (response.data.data && response.data.data.status === 'success') {
        // Double verification of payment status
        return {
          status: 'success',
          data: response.data.data,
          message: 'Payment successfully verified'
        };
      } else if (response.data.data && response.data.data.status === 'pending') {
        // Payment is still pending, report this explicitly
        return {
          status: 'pending',
          data: response.data.data,
          message: 'Payment is still pending. Verification will continue.'
        };
      } else {
        // API call succeeded but payment verification failed
        console.warn(`Payment verification request successful but payment status not confirmed: ${txRef}`, response.data);
        return {
          status: 'pending',
          data: response.data,
          message: 'Payment verification in progress. Status not confirmed yet.'
        };
      }
    } else {
      // Failed verification
      console.error(`Payment verification failed for ${txRef}:`, response.data);
      return {
        status: 'failed',
        data: response.data,
        message: response.data.message || 'Payment verification failed'
      };
    }
  } catch (error) {
    // Detailed error logging based on error type
    if (error.response) {
      // Server responded with an error status code
      console.error(`Verification API error response for ${txRef}:`, {
        status: error.response.status,
        data: error.response.data
      });

      // Handle specific error status codes
      if (error.response.status === 404) {
        return {
          status: 'pending',
          message: 'Transaction not found yet. It might still be processing.'
        };
      } else if (error.response.status === 429) {
        return {
          status: 'pending',
          message: 'Too many verification attempts. Please try again later.'
        };
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error(`Verification network error for ${txRef}:`, error.request);
      return {
        status: 'pending',
        message: 'Network error during verification. Payment status unknown.'
      };
    } else if (error.code === 'ECONNABORTED') {
      // Timeout occurred
      console.error(`Verification timeout for ${txRef}`);
      return {
        status: 'pending',
        message: 'Verification request timed out. Payment status unknown.'
      };
    } else {
      // Something else happened while setting up the request
      console.error(`Unexpected verification error for ${txRef}:`, error.message);
    }

    return {
      status: 'error',
      message: 'Error verifying payment. Please try again later.'
    };
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