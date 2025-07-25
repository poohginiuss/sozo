const API_BASE_URL = 'https://dashboard.casthost.net/paywall';

export const authService = {
  async signIn(email, password) {
    try {
      console.log('Attempting sign in for:', email);
      
      const response = await fetch(`${API_BASE_URL}/authentication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          stream_user_id: '4',
          email: email,
          password: password,
        }),
      });

      console.log('Response status:', response.status);

      // Get response as text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
        console.log('Response was not valid JSON:', responseText);
        
        // If response contains HTML (like an error page), extract meaningful info
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return {
            success: false,
            error: 'Server returned an error page. Please check your network connection and try again.',
          };
        }
        
        return {
          success: false,
          error: 'Invalid response from server. Please try again.',
        };
      }

      // Check if the response indicates successful authentication
      // This is the key fix - we need to validate the actual response content
      if (!response.ok) {
        // If HTTP status is not OK, authentication failed
        const errorMessage = data.message || data.error || `Authentication failed (${response.status})`;
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Even if HTTP status is OK, check if the API response indicates success
      // Common patterns for failed authentication with 200 status:
      if (data.success === false || data.authenticated === false || data.status === 'error') {
        return {
          success: false,
          error: data.message || data.error || 'Invalid email or password',
        };
      }

      // Check for specific error indicators in the response
      if (data.error || (data.message && data.message.toLowerCase().includes('error'))) {
        return {
          success: false,
          error: data.error || data.message || 'Authentication failed',
        };
      }

      // If we get here and have valid data, consider it successful
      // But also check if we have expected success indicators
      if (data.success === true || data.authenticated === true || data.status === 'success' || data.token || data.user) {
        console.log('Sign in successful:', data);
        return {
          success: true,
          data: data,
        };
      }

      // If response doesn't clearly indicate success or failure, be conservative
      console.log('Ambiguous response, treating as failure:', data);
      return {
        success: false,
        error: 'Authentication response unclear. Please try again.',
      };

    } catch (error) {
      console.log('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  },

  async updateCredentials(currentEmail, newEmail, newPassword) {
    try {
      console.log('Attempting to update credentials for:', currentEmail);
      
      const body = {
        current_email: currentEmail,
        // Always send both new_email and new_password as API requires both
        new_email: newEmail || currentEmail, // Use current email if not updating email
        new_password: newPassword || 'keepCurrentPassword123', // Placeholder if not updating password
      };

      console.log('Update request body:', body);

      const response = await fetch(`${API_BASE_URL}/update-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Update response status:', response.status);

      // Get response as text first
      const responseText = await response.text();
      console.log('Update raw response:', responseText);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Update JSON parse error:', parseError);
        
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return {
            success: false,
            error: 'Server returned an error page. Please check your network connection and try again.',
          };
        }
        
        return {
          success: false,
          error: 'Invalid response from server. Please try again.',
        };
      }

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      console.log('Update successful:', data);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.log('Update error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  },

  async deleteAccount(email, password) {
    try {
      console.log('Attempting to delete account for:', email);
      
      const response = await fetch(`${API_BASE_URL}/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          stream_user_id: 4,
          email: email,
          password: password,
        }),
      });

      console.log('Delete account response status:', response.status);

      // Get response as text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('Delete account raw response:', responseText);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Delete account JSON parse error:', parseError);
        
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return {
            success: false,
            error: 'Server returned an error page. Please check your network connection and try again.',
          };
        }
        
        return {
          success: false,
          error: 'Invalid response from server. Please try again.',
        };
      }

      // Check if the response indicates successful deletion
      if (!response.ok) {
        const errorMessage = data.message || data.error || `Account deletion failed (${response.status})`;
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Check API response status
      if (data.status === 'success') {
        console.log('Account deletion successful:', data);
        return {
          success: true,
          data: data,
        };
      }

      // Handle error responses
      if (data.status === 'error') {
        return {
          success: false,
          error: data.message || 'Invalid credentials or account deletion failed',
        };
      }

      // If response doesn't clearly indicate success or failure
      console.log('Ambiguous delete response, treating as failure:', data);
      return {
        success: false,
        error: 'Account deletion response unclear. Please try again.',
      };

    } catch (error) {
      console.log('Delete account error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  },
};
