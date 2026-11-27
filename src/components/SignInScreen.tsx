import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Crosshair,
  Mail,
  Lock,
  User,
  Shield,
  ChevronRight,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from 'lucide-react-native';
import { colors } from '../theme';
import {
  GenderType,
  UserProfile,
  DEFAULT_ADMIN_CREDENTIALS,
  registerOperator,
  loginOperator,
  sendOperatorPasswordReset,
  checkEmailExists,
  checkIgnExists,
} from '../utils/authService';

interface Props {
  onSignInSuccess: (profile: UserProfile) => void;
}

const GENDERS: GenderType[] = ['Male', 'Female', 'Prefer not to say'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s]+$/;
const IGN_REGEX = /^[A-Za-z0-9_.-]+$/;

export const SignInScreen: React.FC<Props> = ({ onSignInSuccess }) => {
  // Tab Mode: 'LOGIN' or 'REGISTER'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Shared / Login Fields
  const [identifier, setIdentifier] = useState(''); // Email OR In-Game Name
  const [password, setPassword] = useState('');

  // Register Fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<GenderType>('Male');
  const [inGameName, setInGameName] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password mode
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetSending, setResetSending] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Live validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loginSubmitted, setLoginSubmitted] = useState(false);
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const [ignStatus, setIgnStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  const markTouched = (field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleRegEmailChange = (text: string) => {
    setRegEmail(text);
    const trimmed = text.trim().toLowerCase();
    if (
      !trimmed ||
      !EMAIL_REGEX.test(trimmed) ||
      trimmed === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase()
    ) {
      setEmailStatus('idle');
    } else {
      setEmailStatus('checking');
    }
  };

  const handleIgnChange = (text: string) => {
    setInGameName(text);
    const trimmed = text.trim();
    if (
      !trimmed ||
      trimmed.length < 3 ||
      trimmed.length > 24 ||
      !IGN_REGEX.test(trimmed) ||
      trimmed.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.inGameName.toLowerCase()
    ) {
      setIgnStatus('idle');
    } else {
      setIgnStatus('checking');
    }
  };

  // Debounced live email availability check
  useEffect(() => {
    const trimmed = regEmail.trim().toLowerCase();
    if (
      !trimmed ||
      !EMAIL_REGEX.test(trimmed) ||
      trimmed === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase()
    ) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const exists = await checkEmailExists(trimmed);
      if (!cancelled) {
        setEmailStatus(exists ? 'taken' : 'available');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [regEmail]);

  // Debounced live IGN availability check
  useEffect(() => {
    const trimmed = inGameName.trim();
    if (
      !trimmed ||
      trimmed.length < 3 ||
      trimmed.length > 24 ||
      !IGN_REGEX.test(trimmed) ||
      trimmed.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.inGameName.toLowerCase()
    ) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const exists = await checkIgnExists(trimmed);
      if (!cancelled) {
        setIgnStatus(exists ? 'taken' : 'available');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inGameName]);

  // Live error computation
  const getResetError = (): string | null => {
    const trimmed = resetIdentifier.trim();
    if (!trimmed) return 'Email or In-Game Name is required.';
    if (trimmed.includes('@') && !EMAIL_REGEX.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return null;
  };

  const getLoginErrors = () => {
    const trimmedId = identifier.trim();
    let identifierError: string | null = null;
    if (!trimmedId) {
      identifierError = 'Email or In-Game Name is required.';
    } else if (trimmedId.includes('@')) {
      if (!EMAIL_REGEX.test(trimmedId)) {
        identifierError = 'Please enter a valid email address.';
      }
    } else if (trimmedId.length < 3 || !IGN_REGEX.test(trimmedId)) {
      identifierError = 'IGN must be at least 3 characters (letters, numbers, _, ., -).';
    }

    let passwordError: string | null = null;
    if (!password) {
      passwordError = 'Password is required.';
    } else if (password.length < 6) {
      passwordError = 'Password must be at least 6 characters.';
    }

    return { identifierError, passwordError };
  };

  const getRegisterErrors = () => {
    const trimmedEmail = regEmail.trim();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedAge = age.trim();
    const trimmedIGN = inGameName.trim();

    let emailError: string | null = null;
    if (!trimmedEmail) {
      emailError = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      emailError = 'Enter a valid email address (e.g., player@example.com).';
    } else if (trimmedEmail.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase()) {
      emailError = 'This email is reserved for system administration.';
    } else if (emailStatus === 'taken') {
      emailError = 'This email address is already registered.';
    }

    let passwordError: string | null = null;
    if (!regPassword) {
      passwordError = 'Password is required.';
    } else if (regPassword.length < 6) {
      passwordError = 'Password must be at least 6 characters.';
    } else if (/\s/.test(regPassword)) {
      passwordError = 'Password cannot contain spaces.';
    }

    let firstNameError: string | null = null;
    if (!trimmedFirst) {
      firstNameError = 'First Name is required.';
    } else if (!NAME_REGEX.test(trimmedFirst)) {
      firstNameError = 'Letters only — no numbers or special characters.';
    } else if (trimmedFirst.length < 2) {
      firstNameError = 'Must be at least 2 characters.';
    }

    let lastNameError: string | null = null;
    if (!trimmedLast) {
      lastNameError = 'Last Name is required.';
    } else if (!NAME_REGEX.test(trimmedLast)) {
      lastNameError = 'Letters only — no numbers or special characters.';
    } else if (trimmedLast.length < 2) {
      lastNameError = 'Must be at least 2 characters.';
    }

    let ageError: string | null = null;
    if (!trimmedAge) {
      ageError = 'Age is required.';
    } else if (!/^\d+$/.test(trimmedAge)) {
      ageError = 'Whole numbers only.';
    } else {
      const parsed = parseInt(trimmedAge, 10);
      if (isNaN(parsed) || parsed < 7 || parsed > 120) {
        ageError = 'Age must be 7–120.';
      }
    }

    let ignError: string | null = null;
    if (!trimmedIGN) {
      ignError = 'In-Game Name (IGN) is required.';
    } else if (trimmedIGN.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.inGameName.toLowerCase()) {
      ignError = 'This In-Game Name is reserved.';
    } else if (trimmedIGN.length < 3 || trimmedIGN.length > 24) {
      ignError = 'IGN must be 3–24 characters.';
    } else if (!IGN_REGEX.test(trimmedIGN)) {
      ignError = 'Only letters, numbers, _, ., or - allowed.';
    } else if (ignStatus === 'taken') {
      ignError = 'In-Game Name is already taken.';
    }

    return {
      emailError,
      passwordError,
      firstNameError,
      lastNameError,
      ageError,
      ignError,
    };
  };

  const resetError = getResetError();
  const loginErrors = getLoginErrors();
  const registerErrors = getRegisterErrors();

  const showFieldError = (
    field: string,
    value: string,
    error: string | null,
    submittedFlag: boolean
  ): string | null => {
    if (!error) return null;
    if (value.length > 0 || touched[field] || submittedFlag) return error;
    return null;
  };

  const handleResetPassword = async () => {
    setResetSubmitted(true);
    const trimmedReset = resetIdentifier.trim();
    if (resetError) {
      showAlert('Invalid Input', resetError);
      return;
    }

    setResetSending(true);
    const res = await sendOperatorPasswordReset(trimmedReset);
    setResetSending(false);

    if (res.success) {
      showAlert('Password Reset Email Sent', 'Check your inbox for password reset instructions.');
      setIsForgotPassword(false);
      setResetSubmitted(false);
    } else {
      showAlert('Reset Failed', res.error || 'Could not send reset email.');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Login Handler                                                    */
  /* ---------------------------------------------------------------- */
  const handleLogin = async () => {
    setLoginSubmitted(true);
    if (loginErrors.identifierError || loginErrors.passwordError) {
      showAlert(
        'Validation Error',
        loginErrors.identifierError || loginErrors.passwordError || 'Please check your credentials.'
      );
      return;
    }

    setSubmitting(true);
    const res = await loginOperator({
      identifier: identifier.trim(),
      password,
    });
    setSubmitting(false);

    if (res.success && res.profile) {
      setLoginSubmitted(false);
      onSignInSuccess(res.profile);
    } else {
      showAlert('Login Failed', res.error || 'Invalid credentials.');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Register Handler                                                 */
  /* ---------------------------------------------------------------- */
  const handleRegister = async () => {
    setRegisterSubmitted(true);
    const firstErr =
      registerErrors.emailError ||
      registerErrors.passwordError ||
      registerErrors.firstNameError ||
      registerErrors.lastNameError ||
      registerErrors.ageError ||
      registerErrors.ignError;

    if (firstErr) {
      showAlert('Validation Error', firstErr);
      return;
    }

    const parsedAge = parseInt(age.trim(), 10);

    setSubmitting(true);
    const res = await registerOperator({
      email: regEmail.trim(),
      password: regPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: parsedAge,
      gender,
      inGameName: inGameName.trim(),
    });
    setSubmitting(false);

    if (res.success && res.profile) {
      const registeredEmail = regEmail.trim();
      setRegEmail('');
      setRegPassword('');
      setFirstName('');
      setLastName('');
      setAge('');
      setInGameName('');
      setRegisterSubmitted(false);
      setTouched({});
      setEmailStatus('idle');
      setIgnStatus('idle');
      setIdentifier(registeredEmail);
      setPassword('');
      setMode('LOGIN');
      showAlert('Registration Successful', 'Your account has been created. Please log in to continue.');
    } else {
      showAlert('Registration Failed', res.error || 'Could not create account.');
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Crosshair size={32} color="#F59E0B" />
          </View>
          <Text style={styles.title}>PUBGM GUNLAB</Text>
          <Text style={styles.subtitle}>Tactical Ballistics & Live Recoil Simulator</Text>
        </View>

        {/* Tab Toggle: LOGIN vs REGISTER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'LOGIN' && styles.tabButtonActive]}
            onPress={() => setMode('LOGIN')}
            activeOpacity={0.8}
          >
            <LogIn size={15} color={mode === 'LOGIN' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabButtonText, mode === 'LOGIN' && styles.tabButtonTextActive]}>
              LOG IN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, mode === 'REGISTER' && styles.tabButtonActive]}
            onPress={() => setMode('REGISTER')}
            activeOpacity={0.8}
          >
            <UserPlus size={15} color={mode === 'REGISTER' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabButtonText, mode === 'REGISTER' && styles.tabButtonTextActive]}>
              REGISTER
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {isForgotPassword ? (
            /* ========================================================== */
            /* FORGOT PASSWORD FORM                                       */
            /* ========================================================== */
            <View>
              <View style={styles.forgotHeader}>
                <KeyRound size={26} color="#F59E0B" />
                <Text style={styles.forgotTitle}>RESET PASSWORD</Text>
                <Text style={styles.forgotSub}>
                  Enter your registered Email or In-Game Name to receive a recovery link.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL OR IN-GAME NAME</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      showFieldError('resetIdentifier', resetIdentifier, resetError, resetSubmitted) && styles.inputError,
                    ]}
                    placeholder="operator@pubg.com or Slayers_PRO"
                    placeholderTextColor="#64748B"
                    value={resetIdentifier}
                    onChangeText={setResetIdentifier}
                    onBlur={() => markTouched('resetIdentifier')}
                    autoCapitalize="none"
                  />
                </View>
                {showFieldError('resetIdentifier', resetIdentifier, resetError, resetSubmitted) && (
                  <Text style={styles.errorText}>
                    {showFieldError('resetIdentifier', resetIdentifier, resetError, resetSubmitted)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, resetSending && { opacity: 0.6 }]}
                onPress={handleResetPassword}
                disabled={resetSending}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>
                  {resetSending ? 'SENDING RECOVERY EMAIL...' : 'SEND RESET LINK'}
                </Text>
                <ChevronRight size={18} color="#0F172A" strokeWidth={3} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => setIsForgotPassword(false)}
                activeOpacity={0.7}
              >
                <ArrowLeft size={14} color="#94A3B8" />
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : mode === 'LOGIN' ? (
            /* ========================================================== */
            /* LOGIN FORM (Email OR IGN + Password + Eye Toggle)         */
            /* ========================================================== */
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL OR IN-GAME NAME</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      showFieldError('identifier', identifier, loginErrors.identifierError, loginSubmitted) && styles.inputError,
                    ]}
                    placeholder="e.g. operator@pubg.com or Slayers_PRO"
                    placeholderTextColor="#64748B"
                    value={identifier}
                    onChangeText={setIdentifier}
                    onBlur={() => markTouched('identifier')}
                    autoCapitalize="none"
                  />
                </View>
                {showFieldError('identifier', identifier, loginErrors.identifierError, loginSubmitted) && (
                  <Text style={styles.errorText}>
                    {showFieldError('identifier', identifier, loginErrors.identifierError, loginSubmitted)}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <TouchableOpacity
                    onPress={() => setIsForgotPassword(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotLink}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      styles.inputWithEye,
                      showFieldError('password', password, loginErrors.passwordError, loginSubmitted) && styles.inputError,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => markTouched('password')}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#94A3B8" />
                    ) : (
                      <Eye size={18} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
                {showFieldError('password', password, loginErrors.passwordError, loginSubmitted) && (
                  <Text style={styles.errorText}>
                    {showFieldError('password', password, loginErrors.passwordError, loginSubmitted)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'AUTHENTICATING...' : 'SIGN IN OPERATOR'}
                </Text>
                <ChevronRight size={18} color="#0F172A" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          ) : (
            /* ========================================================== */
            /* REGISTER FORM (Email, Password with Eye, Name, Age, IGN)  */
            /* ========================================================== */
            <View>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      showFieldError('regEmail', regEmail, registerErrors.emailError, registerSubmitted) && styles.inputError,
                      !registerErrors.emailError && emailStatus === 'available' && styles.inputSuccess,
                    ]}
                    placeholder="operator@pubg.com"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={regEmail}
                    onChangeText={handleRegEmailChange}
                    onBlur={() => markTouched('regEmail')}
                  />
                </View>
                {showFieldError('regEmail', regEmail, registerErrors.emailError, registerSubmitted) ? (
                  <Text style={styles.errorText}>
                    {showFieldError('regEmail', regEmail, registerErrors.emailError, registerSubmitted)}
                  </Text>
                ) : emailStatus === 'checking' ? (
                  <Text style={styles.checkingText}>Checking email availability...</Text>
                ) : emailStatus === 'available' ? (
                  <Text style={styles.successText}>Email address is available.</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD (MIN 6 CHARACTERS)</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      styles.inputWithEye,
                      showFieldError('regPassword', regPassword, registerErrors.passwordError, registerSubmitted) && styles.inputError,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showRegPassword}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    onBlur={() => markTouched('regPassword')}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowRegPassword((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    {showRegPassword ? (
                      <EyeOff size={18} color="#94A3B8" />
                    ) : (
                      <Eye size={18} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
                {showFieldError('regPassword', regPassword, registerErrors.passwordError, registerSubmitted) && (
                  <Text style={styles.errorText}>
                    {showFieldError('regPassword', regPassword, registerErrors.passwordError, registerSubmitted)}
                  </Text>
                )}
              </View>

              {/* First Name & Last Name */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>FIRST NAME</Text>
                  <TextInput
                    style={[
                      styles.input,
                      showFieldError('firstName', firstName, registerErrors.firstNameError, registerSubmitted) && styles.inputError,
                    ]}
                    placeholder="Alex"
                    placeholderTextColor="#64748B"
                    value={firstName}
                    onChangeText={setFirstName}
                    onBlur={() => markTouched('firstName')}
                    autoCapitalize="words"
                  />
                  {showFieldError('firstName', firstName, registerErrors.firstNameError, registerSubmitted) && (
                    <Text style={styles.errorText}>
                      {showFieldError('firstName', firstName, registerErrors.firstNameError, registerSubmitted)}
                    </Text>
                  )}
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>LAST NAME</Text>
                  <TextInput
                    style={[
                      styles.input,
                      showFieldError('lastName', lastName, registerErrors.lastNameError, registerSubmitted) && styles.inputError,
                    ]}
                    placeholder="Mason"
                    placeholderTextColor="#64748B"
                    value={lastName}
                    onChangeText={setLastName}
                    onBlur={() => markTouched('lastName')}
                    autoCapitalize="words"
                  />
                  {showFieldError('lastName', lastName, registerErrors.lastNameError, registerSubmitted) && (
                    <Text style={styles.errorText}>
                      {showFieldError('lastName', lastName, registerErrors.lastNameError, registerSubmitted)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Age & Gender */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { width: 90, marginRight: 10, marginBottom: 0 }]}>
                  <Text style={styles.label}>AGE</Text>
                  <TextInput
                    style={[
                      styles.input,
                      showFieldError('age', age, registerErrors.ageError, registerSubmitted) && styles.inputError,
                    ]}
                    placeholder="21"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    maxLength={3}
                    value={age}
                    onChangeText={setAge}
                    onBlur={() => markTouched('age')}
                  />
                  {showFieldError('age', age, registerErrors.ageError, registerSubmitted) && (
                    <Text style={styles.errorText}>
                      {showFieldError('age', age, registerErrors.ageError, registerSubmitted)}
                    </Text>
                  )}
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                  <Text style={styles.label}>GENDER</Text>
                  <View style={styles.genderRow}>
                    {GENDERS.map((g) => {
                      const isSelected = gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderPill,
                            isSelected && styles.genderPillSelected,
                          ]}
                          onPress={() => setGender(g)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.genderText,
                              isSelected && styles.genderTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {g === 'Prefer not to say' ? 'Other' : g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* In Game Name (IGN) */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>IN-GAME NAME (IGN)</Text>
                  <View style={styles.pubgTag}>
                    <Text style={styles.pubgTagText}>UNIQUE PUBG ID</Text>
                  </View>
                </View>
                <View style={styles.inputWrapper}>
                  <Shield size={16} color="#F59E0B" style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      showFieldError('inGameName', inGameName, registerErrors.ignError, registerSubmitted) && styles.inputError,
                      !registerErrors.ignError && ignStatus === 'available' && styles.inputSuccess,
                    ]}
                    placeholder="e.g. Slayers_PRO"
                    placeholderTextColor="#64748B"
                    value={inGameName}
                    onChangeText={handleIgnChange}
                    onBlur={() => markTouched('inGameName')}
                    autoCapitalize="none"
                  />
                </View>
                {showFieldError('inGameName', inGameName, registerErrors.ignError, registerSubmitted) ? (
                  <Text style={styles.errorText}>
                    {showFieldError('inGameName', inGameName, registerErrors.ignError, registerSubmitted)}
                  </Text>
                ) : ignStatus === 'checking' ? (
                  <Text style={styles.checkingText}>Checking IGN availability...</Text>
                ) : ignStatus === 'available' ? (
                  <Text style={styles.successText}>In-Game Name is available.</Text>
                ) : null}
              </View>

              {/* Submit Register Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleRegister}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'CREATING OPERATOR...' : 'COMPLETE REGISTRATION'}
                </Text>
                <ChevronRight size={18} color="#0F172A" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security / Terms */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            🔒 Secured with Firebase Authentication & Cloud Firestore
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.amberTint,
    borderWidth: 1.5,
    borderColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#F59E0B',
  },
  tabButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  pubgTag: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pubgTagText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '800',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputSuccess: {
    borderColor: '#10B981',
  },
  errorText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  checkingText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  successText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  inputWithIcon: {
    paddingLeft: 42,
  },
  inputWithEye: {
    paddingRight: 45,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    padding: 6,
    zIndex: 1,
  },
  forgotLink: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  forgotHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  forgotSub: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
    paddingVertical: 6,
  },
  backToLoginText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderPill: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillSelected: {
    backgroundColor: '#F59E0B22',
    borderColor: '#F59E0B',
  },
  genderText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  genderTextSelected: {
    color: '#F59E0B',
    fontWeight: '900',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 18,
  },
  footerNoteText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
});
