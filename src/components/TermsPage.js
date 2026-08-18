import React from 'react';
import Footer from './Footer';

const TermsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-24 pb-16 px-6 sm:px-12">
        <div className="max-w-3xl mx-auto text-ink">
          <h1 className="font-display font-semibold text-3xl md:text-5xl text-copper mb-8">Terms of Service</h1>
          <p className="text-ink-muted mb-8">Last updated: August 2026</p>
          
          <div className="space-y-8 font-sans leading-relaxed">
            <section>
              <h2 className="font-display font-semibold text-xl mb-3">1. Acceptance of Terms</h2>
              <p className="text-ink-muted">
                By accessing or using the Serva platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>
            
            <section>
              <h2 className="font-display font-semibold text-xl mb-3">2. Description of Service</h2>
              <p className="text-ink-muted">
                Serva is an electronics repair marketplace connecting users with certified technicians. We facilitate booking, tracking, and payments for repair services. We do not provide the repair services directly.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl mb-3">3. AI Diagnosis Estimates</h2>
              <p className="text-ink-muted">
                The repair estimates provided by our AI diagnostic tool are provisional and subject to verification by the assigned technician upon physical inspection of the device. Final pricing may vary if the actual issue differs from the AI assessment.
              </p>
            </section>
            
            <section>
              <h2 className="font-display font-semibold text-xl mb-3">4. Digital Warranty</h2>
              <p className="text-ink-muted">
                Repairs booked through Serva come with a digital warranty certificate. This warranty covers the specific part repaired or replaced and the labor performed for the duration specified on the certificate. It does not cover subsequent accidental damage or unrelated issues.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl mb-3">5. User Responsibilities</h2>
              <p className="text-ink-muted">
                Users are responsible for backing up all data on their devices prior to the repair appointment. Serva and its independent technicians are not liable for any data loss that may occur during the diagnostic or repair process.
              </p>
            </section>

            <section>
              <h2 className="font-display font-semibold text-xl mb-3">6. Cancellations</h2>
              <p className="text-ink-muted">
                You may cancel a repair booking up to 2 hours before the scheduled timeslot without penalty. Cancellations made less than 2 hours before the appointment may be subject to a nominal cancellation fee.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
