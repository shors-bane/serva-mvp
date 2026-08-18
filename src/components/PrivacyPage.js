import React from 'react';
import Footer from './Footer';

const PrivacyPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-24 pb-16 px-6 sm:px-12">
        <div className="max-w-3xl mx-auto text-ink">
          <h1 className="font-display font-semibold text-3xl md:text-5xl text-copper mb-8">Privacy Policy</h1>
          <p className="text-ink-muted mb-8">Last updated: August 2026</p>
          
          <div className="space-y-8 font-sans leading-relaxed">
            <section>
              <h2 className="font-display font-semibold text-xl mb-3">1. Information We Collect</h2>
              <p className="text-ink-muted">
                We collect information you provide directly to us, including your name, phone number, email address, and service address. When you use our AI diagnosis tool, we collect the images you upload and device details provided during the booking process.
              </p>
            </section>
            
            <section>
              <h2 className="font-display font-semibold text-xl mb-3">2. How We Use Your Information</h2>
              <p className="text-ink-muted">
                Your information is used to facilitate repair bookings, communicate with you regarding your service, process payments, and issue digital warranty certificates. The images uploaded for AI diagnosis are used solely for the purpose of generating repair estimates and identifying parts.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl mb-3">3. Information Sharing</h2>
              <p className="text-ink-muted">
                We share your contact information and service address strictly with the independent, certified technician assigned to your booking to enable the doorstep repair service. We do not sell or rent your personal information to third parties.
              </p>
            </section>
            
            <section>
              <h2 className="font-display font-semibold text-xl mb-3">4. Data Security</h2>
              <p className="text-ink-muted">
                We implement robust security measures to protect your personal information. Our platform uses encryption for data transmission and secure storage protocols. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl mb-3">5. Data Retention</h2>
              <p className="text-ink-muted">
                We retain your booking history and digital warranty certificates to provide ongoing service and support. If you wish to have your account and associated data deleted, please contact our support team.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
