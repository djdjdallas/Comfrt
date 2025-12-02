'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, Sun, Users, ArrowRight, Check, MapPin } from 'lucide-react';
import SoftSlider from '@/components/SoftSlider';
import { getPreferences, savePreferences } from '@/lib/preferences';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState({
    noiseSensitivity: 3,
    lightSensitivity: 3,
    spaciousnessPreference: 3,
    location: '',
    otherNeeds: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = getPreferences();
    setPreferences({
      noiseSensitivity: saved.noiseSensitivity || 3,
      lightSensitivity: saved.lightSensitivity || 3,
      spaciousnessPreference: saved.spaciousnessPreference || 3,
      location: saved.location || '',
      otherNeeds: saved.otherNeeds || '',
    });
    setIsLoaded(true);
  }, []);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  const handleComplete = () => {
    savePreferences({
      ...preferences,
      onboardingComplete: true,
    });
    router.push('/');
  };

  const steps = [
    {
      title: 'Your Location',
      description: 'Where would you like to find calm spaces?',
      icon: MapPin,
      content: (
        <div>
          <label
            htmlFor="location"
            style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '500',
              color: '#3d3d3d',
              marginBottom: '12px'
            }}
          >
            City or Neighborhood
          </label>
          <input
            id="location"
            type="text"
            value={preferences.location}
            onChange={(e) => updatePreference('location', e.target.value)}
            placeholder="E.g., Denver, CO or Brooklyn, NY"
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '18px',
              backgroundColor: '#faf9f7',
              border: '2px solid #e8e4dc',
              borderRadius: '16px',
              color: '#3d3d3d',
              fontFamily: 'inherit',
            }}
          />
        </div>
      ),
    },
    {
      title: 'Noise Sensitivity',
      description: 'How sensitive are you to noise and loud sounds?',
      icon: Volume2,
      content: (
        <SoftSlider
          id="noise-sensitivity"
          label="Noise Sensitivity"
          value={preferences.noiseSensitivity}
          onChange={(v) => updatePreference('noiseSensitivity', v)}
          leftLabel="Not sensitive"
          rightLabel="Very sensitive"
        />
      ),
    },
    {
      title: 'Light Sensitivity',
      description: 'How sensitive are you to bright or harsh lighting?',
      icon: Sun,
      content: (
        <SoftSlider
          id="light-sensitivity"
          label="Light Sensitivity"
          value={preferences.lightSensitivity}
          onChange={(v) => updatePreference('lightSensitivity', v)}
          leftLabel="Not sensitive"
          rightLabel="Very sensitive"
        />
      ),
    },
    {
      title: 'Space Preference',
      description: 'Do you prefer spacious, uncrowded venues?',
      icon: Users,
      content: (
        <SoftSlider
          id="space-preference"
          label="Spaciousness Preference"
          value={preferences.spaciousnessPreference}
          onChange={(v) => updatePreference('spaciousnessPreference', v)}
          leftLabel="Cozy is fine"
          rightLabel="Need space"
        />
      ),
    },
    {
      title: 'Anything Else?',
      description: 'Tell us about any other needs or preferences.',
      icon: Check,
      content: (
        <div>
          <label
            htmlFor="other-needs"
            style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '500',
              color: '#3d3d3d',
              marginBottom: '12px'
            }}
          >
            Other Needs (optional)
          </label>
          <textarea
            id="other-needs"
            value={preferences.otherNeeds}
            onChange={(e) => updatePreference('otherNeeds', e.target.value)}
            placeholder="E.g., wheelchair accessible, need a booth for privacy, avoid strong smells..."
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '18px',
              backgroundColor: '#faf9f7',
              border: '2px solid #e8e4dc',
              borderRadius: '16px',
              color: '#3d3d3d',
              fontFamily: 'inherit',
              minHeight: '120px',
              resize: 'none',
            }}
            rows={4}
          />
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLastStep = step === steps.length - 1;

  if (!isLoaded) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f3f1ed',
        }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Progress */}
      <div style={{ maxWidth: '576px', margin: '0 auto', width: '100%', padding: '32px 16px 0' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: idx <= step ? '#96a87f' : '#e8e4dc',
                transition: 'background-color 0.5s ease',
              }}
            />
          ))}
        </div>
        <p style={{
          fontSize: '14px',
          color: '#9a9a9a',
          marginTop: '12px',
          textAlign: 'center'
        }}>
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div style={{ maxWidth: '448px', width: '100%' }} key={step}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 32px',
            borderRadius: '50%',
            backgroundColor: '#e8ebe4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon style={{ width: '40px', height: '40px', color: '#96a87f' }} />
          </div>

          {/* Title & Description */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#3d3d3d',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            {currentStep.title}
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b6b6b',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            {currentStep.description}
          </p>

          {/* Step Content */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(61, 61, 61, 0.06)',
            border: '1px solid #f3f1ed',
          }}>
            {currentStep.content}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ maxWidth: '448px', margin: '0 auto', width: '100%', padding: '0 16px 32px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '16px',
              backgroundColor: '#f3f1ed',
              color: '#3d3d3d',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '16px',
              backgroundColor: '#96a87f',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isLastStep ? (
              <>
                <Check size={18} />
                Save Preferences
              </>
            ) : (
              <>
                Next
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#9a9a9a',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          You can update these preferences anytime
        </p>
      </div>
    </div>
  );
}
