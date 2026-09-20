import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import LanguagePicker, {
  LanguageOption,
} from "../components/LanguagePicker";

import AudioPlayer from "../components/AudioPlayer";

import {
  generateAudio,
  getLanguages,
  translateText,
} from "../services/api";


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const MAX_TEXT_LENGTH = 5000;


// ============================================================
// COMPONENTE
// ============================================================

export default function HomeScreen() {

  // ==========================================================
  // TEXTO
  // ==========================================================

  const [text, setText] = useState("");

  const [translatedText, setTranslatedText] =
    useState("");


  // ==========================================================
  // IDIOMAS
  // ==========================================================

  const [languages, setLanguages] = useState<
    LanguageOption[]
  >([]);

  const [sourceLanguage, setSourceLanguage] =
    useState("auto");

  const [targetLanguage, setTargetLanguage] =
    useState("en");


  // ==========================================================
  // ÁUDIO
  // ==========================================================

  const [audioUrl, setAudioUrl] = useState<
    string | null
  >(null);

  const [slowVoice, setSlowVoice] =
    useState(false);


  // ==========================================================
  // LOADING
  // ==========================================================

  const [loadingLanguages, setLoadingLanguages] =
    useState(true);

  const [translating, setTranslating] =
    useState(false);

  const [generatingAudio, setGeneratingAudio] =
    useState(false);


  // ==========================================================
  // CARREGAR IDIOMAS
  // ==========================================================

  useEffect(() => {

    loadLanguages();

  }, []);


  async function loadLanguages() {

    try {

      setLoadingLanguages(true);

      const data = await getLanguages();

      setLanguages(data);

      // Se inglês existir, mantém como padrão.
      const englishExists = data.some(
        (language) =>
          language.code.toLowerCase() === "en"
      );

      if (!englishExists && data.length > 0) {

        setTargetLanguage(
          data[0].code
        );

      }

    } catch (error) {

      console.error(
        "Erro ao carregar idiomas:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível carregar os idiomas disponíveis."
      );

    } finally {

      setLoadingLanguages(false);

    }

  }


  // ==========================================================
  // CONTADOR DE CARACTERES
  // ==========================================================

  const characterCount = useMemo(
    () => text.length,
    [text]
  );


  // ==========================================================
  // ALTERAR TEXTO
  // ==========================================================

  function handleTextChange(value: string) {

    setText(value);

    // Se o usuário alterar o texto original,
    // invalidamos a tradução anterior.

    setTranslatedText("");

    setAudioUrl(null);

  }


  // ==========================================================
  // ALTERAR IDIOMA DE ORIGEM
  // ==========================================================

  function handleSourceLanguageChange(
    language: string
  ) {

    setSourceLanguage(language);

    setTranslatedText("");

    setAudioUrl(null);

  }


  // ==========================================================
  // ALTERAR IDIOMA DE DESTINO
  // ==========================================================

  function handleTargetLanguageChange(
    language: string
  ) {

    setTargetLanguage(language);

    setTranslatedText("");

    setAudioUrl(null);

  }


  // ==========================================================
  // TRADUZIR
  // ==========================================================

  async function handleTranslate() {

    const cleanedText = text.trim();

    if (!cleanedText) {

      Alert.alert(
        "Digite um texto",
        "Escreva alguma coisa antes de realizar a tradução."
      );

      return;

    }


    if (!targetLanguage) {

      Alert.alert(
        "Selecione um idioma",
        "Escolha o idioma para o qual deseja traduzir."
      );

      return;

    }


    try {

      setTranslating(true);

      setTranslatedText("");

      setAudioUrl(null);


      const result = await translateText({
        text: cleanedText,
        source: sourceLanguage,
        target: targetLanguage,
      });


      setTranslatedText(
        result.translated
      );


    } catch (error) {

      console.error(
        "Erro ao traduzir:",
        error
      );

      Alert.alert(
        "Erro na tradução",
        getErrorMessage(error)
      );

    } finally {

      setTranslating(false);

    }

  }


  // ==========================================================
  // GERAR ÁUDIO
  // ==========================================================

  async function handleGenerateAudio() {

    if (!translatedText.trim()) {

      Alert.alert(
        "Tradução necessária",
        "Primeiro faça a tradução do texto."
      );

      return;

    }


    try {

      setGeneratingAudio(true);

      setAudioUrl(null);


      const result = await generateAudio({
        text: translatedText,
        lang: targetLanguage,
        slow: slowVoice,
      });


      setAudioUrl(
        result.audio_url
      );


    } catch (error) {

      console.error(
        "Erro ao gerar áudio:",
        error
      );

      Alert.alert(
        "Erro ao gerar áudio",
        getErrorMessage(error)
      );

    } finally {

      setGeneratingAudio(false);

    }

  }


  // ==========================================================
  // LIMPAR
  // ==========================================================

  function handleClear() {

    setText("");

    setTranslatedText("");

    setAudioUrl(null);

    setSourceLanguage("auto");

    setSlowVoice(false);

  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ================================================= */}
        {/* CABEÇALHO                                        */}
        {/* ================================================= */}

        <View style={styles.header}>

          <Text style={styles.title}>
            Tradutor & Áudio
          </Text>

          <Text style={styles.subtitle}>
            Traduza textos e transforme a tradução em áudio.
          </Text>

        </View>


        {/* ================================================= */}
        {/* TEXTO ORIGINAL                                   */}
        {/* ================================================= */}

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <Text style={styles.label}>
              Texto
            </Text>

            <Text style={styles.characterCount}>
              {characterCount}/{MAX_TEXT_LENGTH}
            </Text>

          </View>


          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Digite ou cole o texto que deseja traduzir..."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            maxLength={MAX_TEXT_LENGTH}
            autoCorrect
          />

        </View>


        {/* ================================================= */}
        {/* IDIOMA DE ORIGEM                                 */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text style={styles.label}>
            Idioma original
          </Text>


          {loadingLanguages ? (

            <View style={styles.loadingLanguages}>

              <ActivityIndicator />

              <Text style={styles.loadingText}>
                Carregando idiomas...
              </Text>

            </View>

          ) : (

            <LanguagePicker
              languages={languages}
              value={sourceLanguage}
              onChange={
                handleSourceLanguageChange
              }
              includeAuto
            />

          )}

        </View>


        {/* ================================================= */}
        {/* SETA                                             */}
        {/* ================================================= */}

        <View style={styles.arrowContainer}>

          <Text style={styles.arrow}>
            ↓
          </Text>

        </View>


        {/* ================================================= */}
        {/* IDIOMA DE DESTINO                                */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text style={styles.label}>
            Traduzir para
          </Text>


          {loadingLanguages ? (

            <View style={styles.loadingLanguages}>

              <ActivityIndicator />

              <Text style={styles.loadingText}>
                Carregando idiomas...
              </Text>

            </View>

          ) : (

            <LanguagePicker
              languages={languages}
              value={targetLanguage}
              onChange={
                handleTargetLanguageChange
              }
            />

          )}

        </View>


        {/* ================================================= */}
        {/* BOTÃO TRADUZIR                                   */}
        {/* ================================================= */}

        <TouchableOpacity
          style={[
            styles.primaryButton,

            (
              translating ||
              loadingLanguages ||
              !text.trim()
            ) &&
            styles.disabledButton,
          ]}
          onPress={handleTranslate}
          disabled={
            translating ||
            loadingLanguages ||
            !text.trim()
          }
          activeOpacity={0.8}
        >

          {translating ? (

            <View style={styles.buttonLoading}>

              <ActivityIndicator
                color="#ffffff"
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Traduzindo...
              </Text>

            </View>

          ) : (

            <Text
              style={
                styles.primaryButtonText
              }
            >
              Traduzir
            </Text>

          )}

        </TouchableOpacity>


        {/* ================================================= */}
        {/* RESULTADO                                        */}
        {/* ================================================= */}

        {translatedText !== "" && (

          <View style={styles.resultContainer}>

            <Text style={styles.resultLabel}>
              Tradução
            </Text>


            <View style={styles.translationBox}>

              <Text style={styles.translationText}>
                {translatedText}
              </Text>

            </View>


            {/* ============================================= */}
            {/* VELOCIDADE DA VOZ                            */}
            {/* ============================================= */}

            <View style={styles.voiceOptions}>

              <View style={styles.voiceTextContainer}>

                <Text style={styles.voiceTitle}>
                  Fala mais lenta
                </Text>

                <Text style={styles.voiceDescription}>
                  Útil para estudar a pronúncia.
                </Text>

              </View>


              <Switch
                value={slowVoice}
                onValueChange={(value) => {

                  setSlowVoice(value);

                  // O áudio existente foi criado
                  // com outra configuração.

                  setAudioUrl(null);

                }}
              />

            </View>


            {/* ============================================= */}
            {/* GERAR ÁUDIO                                  */}
            {/* ============================================= */}

            <TouchableOpacity
              style={[
                styles.audioButton,

                generatingAudio &&
                styles.disabledButton,
              ]}
              onPress={
                handleGenerateAudio
              }
              disabled={
                generatingAudio
              }
              activeOpacity={0.8}
            >

              {generatingAudio ? (

                <View
                  style={
                    styles.buttonLoading
                  }
                >

                  <ActivityIndicator
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.audioButtonText
                    }
                  >
                    Gerando áudio...
                  </Text>

                </View>

              ) : (

                <Text
                  style={
                    styles.audioButtonText
                  }
                >
                  🔊 Gerar áudio
                </Text>

              )}

            </TouchableOpacity>


            {/* ============================================= */}
            {/* PLAYER                                       */}
            {/* ============================================= */}

            {audioUrl && (

              <View style={styles.playerContainer}>

                <Text style={styles.audioReady}>
                  Áudio pronto
                </Text>

                <AudioPlayer
                  audioUrl={audioUrl}
                />

              </View>

            )}

          </View>

        )}


        {/* ================================================= */}
        {/* LIMPAR                                           */}
        {/* ================================================= */}

        {(
          text.length > 0 ||
          translatedText.length > 0
        ) && (

          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >

            <Text
              style={
                styles.clearButtonText
              }
            >
              Limpar tudo
            </Text>

          </TouchableOpacity>

        )}


        <View style={styles.bottomSpace} />

      </ScrollView>

    </KeyboardAvoidingView>

  );

}


// ============================================================
// TRATAMENTO DE ERRO
// ============================================================

function getErrorMessage(
  error: unknown
): string {

  if (
    typeof error === "object" &&
    error !== null
  ) {

    if (
      "message" in error &&
      typeof error.message === "string"
    ) {

      return error.message;

    }

  }

  return (
    "Não foi possível concluir a operação. " +
    "Verifique sua conexão e tente novamente."
  );

}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },


  scroll: {
    flex: 1,
  },


  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },


  // ==========================================================
  // CABEÇALHO
  // ==========================================================

  header: {
    marginBottom: 28,
  },


  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
  },


  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#64748b",
  },


  // ==========================================================
  // SEÇÕES
  // ==========================================================

  section: {
    marginBottom: 18,
  },


  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },


  label: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },


  characterCount: {
    marginBottom: 8,
    fontSize: 12,
    color: "#94a3b8",
  },


  // ==========================================================
  // INPUT
  // ==========================================================

  textInput: {
    minHeight: 160,
    maxHeight: 280,
    paddingHorizontal: 16,
    paddingVertical: 14,

    backgroundColor: "#ffffff",

    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,

    fontSize: 16,
    lineHeight: 23,
    color: "#0f172a",
  },


  // ==========================================================
  // IDIOMAS
  // ==========================================================

  loadingLanguages: {
    minHeight: 54,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,

    backgroundColor: "#ffffff",

    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
  },


  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#64748b",
  },


  arrowContainer: {
    alignItems: "center",
    marginTop: -8,
    marginBottom: 10,
  },


  arrow: {
    fontSize: 28,
    fontWeight: "700",
    color: "#64748b",
  },


  // ==========================================================
  // BOTÕES
  // ==========================================================

  primaryButton: {
    minHeight: 56,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,
    marginBottom: 26,

    paddingHorizontal: 20,

    backgroundColor: "#2563eb",

    borderRadius: 14,
  },


  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },


  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },


  disabledButton: {
    opacity: 0.55,
  },


  // ==========================================================
  // TRADUÇÃO
  // ==========================================================

  resultContainer: {
    marginBottom: 24,
  },


  resultLabel: {
    marginBottom: 8,

    fontSize: 17,
    fontWeight: "800",

    color: "#0f172a",
  },


  translationBox: {
    padding: 16,

    backgroundColor: "#ffffff",

    borderWidth: 1,
    borderColor: "#cbd5e1",

    borderRadius: 14,
  },


  translationText: {
    fontSize: 17,
    lineHeight: 26,
    color: "#0f172a",
  },


  // ==========================================================
  // VOZ
  // ==========================================================

  voiceOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginTop: 16,

    paddingHorizontal: 16,
    paddingVertical: 14,

    backgroundColor: "#ffffff",

    borderWidth: 1,
    borderColor: "#e2e8f0",

    borderRadius: 14,
  },


  voiceTextContainer: {
    flex: 1,
    paddingRight: 16,
  },


  voiceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },


  voiceDescription: {
    marginTop: 3,
    fontSize: 13,
    color: "#94a3b8",
  },


  // ==========================================================
  // ÁUDIO
  // ==========================================================

  audioButton: {
    minHeight: 54,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 16,

    paddingHorizontal: 20,

    backgroundColor: "#0f172a",

    borderRadius: 14,
  },


  audioButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },


  playerContainer: {
    marginTop: 18,
  },


  audioReady: {
    marginBottom: 8,

    fontSize: 14,
    fontWeight: "700",

    color: "#16a34a",
  },


  // ==========================================================
  // LIMPAR
  // ==========================================================

  clearButton: {
    alignItems: "center",
    justifyContent: "center",

    minHeight: 48,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: "#cbd5e1",

    borderRadius: 12,
  },


  clearButtonText: {
    fontSize: 14,
    fontWeight: "700",

    color: "#64748b",
  },


  bottomSpace: {
    height: 30,
  },

});