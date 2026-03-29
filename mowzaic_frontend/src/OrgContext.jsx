import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BACKEND_URL } from './constants';

const OrgContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};

export const OrgProvider = ({ children }) => {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const hostname = window.location.hostname;

        // In development, use default org or env override
        const domain = hostname === 'localhost'
          ? (import.meta.env.VITE_ORG_DOMAIN || 'mowzaic.com')
          : hostname;

        const res = await fetch(`${BACKEND_URL}/organizations/by-domain?domain=${encodeURIComponent(domain)}`);

        if (res.ok) {
          const data = await res.json();
          setOrg(data);

          // Set CSS custom properties for dynamic theming
          const root = document.documentElement.style;
          root.setProperty('--color-primary', data.primary_color || '#22c55e');
          root.setProperty('--color-primary-dark', data.primary_color_dark || '#14532d');
          root.setProperty('--color-bg', data.background_color || '#f0fdf4');
        } else {
          console.warn('Org not found for domain:', domain);
          // Use defaults
          setOrg({
            id: null,
            name: 'Mowzaic',
            primary_color: '#22c55e',
            primary_color_dark: '#14532d',
            background_color: '#f0fdf4',
            headline: 'mow delivered, just like that',
            footer_text: 'Mowzaic',
          });
        }
      } catch (err) {
        console.error('Failed to fetch org branding:', err);
        setOrg({
          id: null,
          name: 'Mowzaic',
          primary_color: '#22c55e',
          primary_color_dark: '#14532d',
          background_color: '#f0fdf4',
          headline: 'mow delivered, just like that',
          footer_text: 'Mowzaic',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, []);

  const value = {
    org,
    orgId: org?.id || null,
    orgName: org?.name || 'Mowzaic',
    loading,
  };

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
};

OrgProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { OrgContext };
