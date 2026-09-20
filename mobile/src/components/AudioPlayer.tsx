import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

import * as FileSystem
  from "expo-file-system/legacy";

import * as Sharing
  from "expo-sharing";


// ============================================================
// PROPS
// ============================================================

interface AudioPlayerProps {
  audioUrl: string;
}


// ============================================================
// COMPONENTE
// ============================================================

export default function AudioPlayer({
  audioUrl,
}: AudioPlayerProps) {

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const [
    downloading,
    setDownloading,
  ] = useState(false);


  const [
    sharing,
    setSharing,
  ] = useState(false);


  // ==========================================================
  // PLAYER
  // ==========================================================

  const player = useAudioPlayer(
    audioUrl,
    {
      updateInterval: 250,

      /*
        Como os MP3 gerados são pequenos,
        baixamos primeiro para deixar
        a reprodução mais estável.
      */
      downloadFirst: true,
    }
  );


  // ==========================================================
  // STATUS DO PLAYER
  // ==========================================================

  const status =
    useAudioPlayerStatus(
      player
    );


  // ==========================================================
  // CONFIGURAÇÃO DE ÁUDIO
  // ==========================================================

  useEffect(() => {

    async function configureAudio() {

      try {

        await setAudioModeAsync({

          playsInSilentMode:
            true,

          shouldPlayInBackground:
            false,

          interruptionMode:
            "duckOthers",

        });

      } catch (error) {

        console.error(
          "Erro ao configurar áudio:",
          error
        );

      }

    }


    configureAudio();

  }, []);


  // ==========================================================
  // STATUS
  // ==========================================================

  const isLoaded =
    status.isLoaded;


  const isPlaying =
    status.playing;


  const isBuffering =
    status.isBuffering;


  const currentTime =
    Number.isFinite(
      status.currentTime
    )
      ? status.currentTime
      : 0;


  const duration =
    Number.isFinite(
      status.duration
    )
      ? status.duration
      : 0;


  // ==========================================================
  // PROGRESSO
  // ==========================================================

  const progress =
    duration > 0
      ? Math.min(
          Math.max(
            currentTime
            /
            duration,
            0
          ),
          1
        )
      : 0;


  // ==========================================================
  // PLAY / PAUSE
  // ==========================================================

  async function handlePlayPause() {

    try {

      if (!isLoaded) {

        return;

      }


      if (isPlaying) {

        player.pause();

        return;

      }


      /*
        Se terminou,
        volta ao início.
      */

      if (
        duration > 0
        &&
        currentTime >=
          duration - 0.1
      ) {

        await player.seekTo(
          0
        );

      }


      player.play();


    } catch (error) {

      console.error(
        "Erro ao reproduzir áudio:",
        error
      );

    }

  }


  // ==========================================================
  // VOLTAR 5 SEGUNDOS
  // ==========================================================

  async function handleBackward() {

    try {

      if (!isLoaded) {

        return;

      }


      const newPosition =
        Math.max(
          currentTime - 5,
          0
        );


      await player.seekTo(
        newPosition
      );


    } catch (error) {

      console.error(
        "Erro ao voltar áudio:",
        error
      );

    }

  }


  // ==========================================================
  // AVANÇAR 5 SEGUNDOS
  // ==========================================================

  async function handleForward() {

    try {

      if (!isLoaded) {

        return;

      }


      if (duration <= 0) {

        return;

      }


      const newPosition =
        Math.min(
          currentTime + 5,
          duration
        );


      await player.seekTo(
        newPosition
      );


    } catch (error) {

      console.error(
        "Erro ao avançar áudio:",
        error
      );

    }

  }


  // ==========================================================
  // REPETIR
  // ==========================================================

  async function handleReplay() {

    try {

      if (!isLoaded) {

        return;

      }


      await player.seekTo(
        0
      );


      player.play();


    } catch (error) {

      console.error(
        "Erro ao reiniciar áudio:",
        error
      );

    }

  }


  // ==========================================================
  // GERAR NOME DO ARQUIVO
  // ==========================================================

  function generateFileName() {

    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );


    const hours =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );


    const minutes =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );


    const seconds =
      String(
        now.getSeconds()
      ).padStart(
        2,
        "0"
      );


    return (
      `traducao-`
      +
      `${year}-${month}-${day}-`
      +
      `${hours}-${minutes}-${seconds}`
    );

  }


  // ==========================================================
  // BAIXAR ARQUIVO TEMPORÁRIO
  // ==========================================================

  async function downloadTemporaryAudio(
    fileName: string
  ) {

    if (
      !FileSystem.cacheDirectory
    ) {

      throw new Error(
        "Diretório temporário não disponível."
      );

    }


    const temporaryPath =
      FileSystem.cacheDirectory
      +
      `${fileName}.mp3`;


    /*
      Caso já exista,
      removemos antes.
    */

    const info =
      await FileSystem.getInfoAsync(
        temporaryPath
      );


    if (info.exists) {

      await FileSystem.deleteAsync(
        temporaryPath,
        {
          idempotent: true,
        }
      );

    }


    const downloaded =
      await FileSystem.downloadAsync(
        audioUrl,
        temporaryPath
      );


    /*
      Confirma resposta HTTP.
    */

    if (
      downloaded.status < 200
      ||
      downloaded.status >= 300
    ) {

      throw new Error(
        `Erro HTTP ${downloaded.status}`
      );

    }


    return downloaded.uri;

  }


  // ==========================================================
  // SALVAR MP3
  // ==========================================================

  async function handleDownload() {

    if (downloading) {

      return;

    }


    try {

      setDownloading(
        true
      );


      const fileName =
        generateFileName();


      // ------------------------------------------------------
      // BAIXA O MP3 PARA O CACHE
      // ------------------------------------------------------

      const temporaryUri =
        await downloadTemporaryAudio(
          fileName
        );


      // ======================================================
      // ANDROID
      // ======================================================

      if (
        Platform.OS ===
        "android"
      ) {

        const SAF =
          FileSystem
            .StorageAccessFramework;


        /*
          Tentamos abrir diretamente
          na pasta Download.
        */

        const downloadFolder =
          SAF.getUriForDirectoryInRoot(
            "Download"
          );


        /*
          O Android pede ao usuário
          autorização para utilizar
          aquela pasta.
        */

        const permission =
          await SAF
            .requestDirectoryPermissionsAsync(
              downloadFolder
            );


        if (
          !permission.granted
        ) {

          Alert.alert(
            "Download cancelado",
            "Selecione e autorize a pasta Download para salvar o MP3."
          );

          return;

        }


        // ----------------------------------------------------
        // LER MP3 COMO BASE64
        // ----------------------------------------------------

        const base64 =
          await FileSystem
            .readAsStringAsync(
              temporaryUri,
              {
                encoding:
                  FileSystem
                    .EncodingType
                    .Base64,
              }
            );


        // ----------------------------------------------------
        // CRIAR MP3 NA PASTA DOWNLOAD
        // ----------------------------------------------------

        const destinationUri =
          await SAF.createFileAsync(
            permission.directoryUri,

            /*
              A documentação do SAF pede
              nome sem extensão.
            */
            fileName,

            "audio/mpeg"
          );


        // ----------------------------------------------------
        // ESCREVER CONTEÚDO
        // ----------------------------------------------------

        await FileSystem
          .writeAsStringAsync(
            destinationUri,
            base64,
            {
              encoding:
                FileSystem
                  .EncodingType
                  .Base64,
            }
          );


        Alert.alert(
          "Áudio salvo",
          `O arquivo ${fileName}.mp3 foi salvo na pasta selecionada.`
        );


        return;

      }


      // ======================================================
      // IOS
      // ======================================================

      const sharingAvailable =
        await Sharing
          .isAvailableAsync();


      if (
        sharingAvailable
      ) {

        await Sharing.shareAsync(
          temporaryUri,
          {
            mimeType:
              "audio/mpeg",

            UTI:
              "public.mp3",
          }
        );


        return;

      }


      Alert.alert(
        "Áudio criado",
        "O arquivo foi criado, mas o compartilhamento não está disponível neste aparelho."
      );


    } catch (error) {

      console.error(
        "Erro ao salvar áudio:",
        error
      );


      Alert.alert(
        "Erro ao salvar",
        getDownloadErrorMessage(
          error
        )
      );


    } finally {

      setDownloading(
        false
      );

    }

  }


  // ==========================================================
  // COMPARTILHAR
  // ==========================================================

  async function handleShare() {

    if (sharing) {

      return;

    }


    try {

      setSharing(
        true
      );


      const available =
        await Sharing
          .isAvailableAsync();


      if (!available) {

        Alert.alert(
          "Compartilhamento indisponível",
          "Este aparelho não possui compartilhamento de arquivos disponível."
        );

        return;

      }


      const fileName =
        generateFileName();


      const temporaryUri =
        await downloadTemporaryAudio(
          fileName
        );


      await Sharing.shareAsync(
        temporaryUri,
        {
          mimeType:
            "audio/mpeg",

          dialogTitle:
            "Compartilhar áudio",

          UTI:
            "public.mp3",
        }
      );


    } catch (error) {

      console.error(
        "Erro ao compartilhar:",
        error
      );


      Alert.alert(
        "Erro",
        "Não foi possível compartilhar o áudio."
      );


    } finally {

      setSharing(
        false
      );

    }

  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <View
      style={
        styles.container
      }
    >

      {/* ================================================= */}
      {/* CARREGANDO                                       */}
      {/* ================================================= */}

      {
        !isLoaded
          ? (

            <View
              style={
                styles.loadingContainer
              }
            >

              <ActivityIndicator />


              <Text
                style={
                  styles.loadingText
                }
              >
                Carregando áudio...
              </Text>

            </View>

          )
          : (

            <>

              {/* ========================================= */}
              {/* PROGRESSO                                */}
              {/* ========================================= */}

              <View
                style={
                  styles.progressSection
                }
              >

                <View
                  style={
                    styles.progressBackground
                  }
                >

                  <View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          `${progress * 100}%`,
                      },
                    ]}
                  />

                </View>


                {/* ======================================= */}
                {/* TEMPO                                  */}
                {/* ======================================= */}

                <View
                  style={
                    styles.timeContainer
                  }
                >

                  <Text
                    style={
                      styles.timeText
                    }
                  >
                    {
                      formatTime(
                        currentTime
                      )
                    }
                  </Text>


                  <Text
                    style={
                      styles.timeText
                    }
                  >
                    {
                      formatTime(
                        duration
                      )
                    }
                  </Text>

                </View>

              </View>


              {/* ========================================= */}
              {/* CONTROLES                                */}
              {/* ========================================= */}

              <View
                style={
                  styles.controls
                }
              >

                {/* VOLTAR */}

                <TouchableOpacity
                  style={
                    styles.secondaryButton
                  }
                  onPress={
                    handleBackward
                  }
                  activeOpacity={
                    0.7
                  }
                >

                  <Text
                    style={
                      styles.secondaryIcon
                    }
                  >
                    ↶
                  </Text>


                  <Text
                    style={
                      styles.secondaryText
                    }
                  >
                    5s
                  </Text>

                </TouchableOpacity>


                {/* PLAY / PAUSE */}

                <TouchableOpacity
                  style={
                    styles.playButton
                  }
                  onPress={
                    handlePlayPause
                  }
                  activeOpacity={
                    0.8
                  }
                >

                  {
                    isBuffering
                      ? (

                        <ActivityIndicator
                          color="#ffffff"
                          size="small"
                        />

                      )
                      : (

                        <Text
                          style={
                            styles.playIcon
                          }
                        >
                          {
                            isPlaying
                              ? "❚❚"
                              : "▶"
                          }
                        </Text>

                      )
                  }

                </TouchableOpacity>


                {/* AVANÇAR */}

                <TouchableOpacity
                  style={
                    styles.secondaryButton
                  }
                  onPress={
                    handleForward
                  }
                  activeOpacity={
                    0.7
                  }
                >

                  <Text
                    style={
                      styles.secondaryIcon
                    }
                  >
                    ↷
                  </Text>


                  <Text
                    style={
                      styles.secondaryText
                    }
                  >
                    5s
                  </Text>

                </TouchableOpacity>

              </View>


              {/* ========================================= */}
              {/* REPETIR                                  */}
              {/* ========================================= */}

              <TouchableOpacity
                style={
                  styles.replayButton
                }
                onPress={
                  handleReplay
                }
                activeOpacity={
                  0.7
                }
              >

                <Text
                  style={
                    styles.replayIcon
                  }
                >
                  ↻
                </Text>


                <Text
                  style={
                    styles.replayText
                  }
                >
                  Reproduzir novamente
                </Text>

              </TouchableOpacity>


              {/* ========================================= */}
              {/* SALVAR MP3                               */}
              {/* ========================================= */}

              <TouchableOpacity
                style={[
                  styles.downloadButton,

                  downloading
                  &&
                  styles.disabledButton,
                ]}
                onPress={
                  handleDownload
                }
                disabled={
                  downloading
                }
                activeOpacity={
                  0.8
                }
              >

                {
                  downloading
                    ? (

                      <View
                        style={
                          styles.loadingButton
                        }
                      >

                        <ActivityIndicator
                          color="#ffffff"
                          size="small"
                        />


                        <Text
                          style={
                            styles.downloadButtonText
                          }
                        >
                          Salvando...
                        </Text>

                      </View>

                    )
                    : (

                      <Text
                        style={
                          styles.downloadButtonText
                        }
                      >
                        ↓ Baixar MP3
                      </Text>

                    )
                }

              </TouchableOpacity>


              {/* ========================================= */}
              {/* COMPARTILHAR                             */}
              {/* ========================================= */}

              <TouchableOpacity
                style={[
                  styles.shareButton,

                  sharing
                  &&
                  styles.disabledButton,
                ]}
                onPress={
                  handleShare
                }
                disabled={
                  sharing
                }
                activeOpacity={
                  0.8
                }
              >

                {
                  sharing
                    ? (

                      <ActivityIndicator
                        size="small"
                      />

                    )
                    : (

                      <Text
                        style={
                          styles.shareButtonText
                        }
                      >
                        ↗ Compartilhar áudio
                      </Text>

                    )
                }

              </TouchableOpacity>

            </>

          )
      }

    </View>

  );

}


// ============================================================
// FORMATAR TEMPO
// ============================================================

function formatTime(
  seconds: number
): string {

  if (
    !Number.isFinite(
      seconds
    )
    ||
    seconds < 0
  ) {

    return "00:00";

  }


  const totalSeconds =
    Math.floor(
      seconds
    );


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const remainingSeconds =
    totalSeconds % 60;


  return (
    `${minutes
      .toString()
      .padStart(
        2,
        "0"
      )}:`
    +
    `${remainingSeconds
      .toString()
      .padStart(
        2,
        "0"
      )}`
  );

}


// ============================================================
// ERRO DE DOWNLOAD
// ============================================================

function getDownloadErrorMessage(
  error: unknown
): string {

  if (
    error instanceof Error
    &&
    error.message
  ) {

    return (
      "Não foi possível salvar o MP3. "
      +
      error.message
    );

  }


  return (
    "Não foi possível salvar o MP3."
  );

}


// ============================================================
// ESTILOS
// ============================================================

const styles =
  StyleSheet.create({

    // ========================================================
    // CONTAINER
    // ========================================================

    container: {

      padding: 16,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,

      borderColor:
        "#e2e8f0",

      borderRadius: 16,

    },


    // ========================================================
    // LOADING
    // ========================================================

    loadingContainer: {

      minHeight: 90,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

    },


    loadingText: {

      marginLeft: 10,

      fontSize: 14,

      color:
        "#64748b",

    },


    // ========================================================
    // PROGRESSO
    // ========================================================

    progressSection: {

      marginBottom: 16,

    },


    progressBackground: {

      width: "100%",

      height: 7,

      overflow:
        "hidden",

      backgroundColor:
        "#e2e8f0",

      borderRadius: 999,

    },


    progressFill: {

      height: "100%",

      backgroundColor:
        "#2563eb",

      borderRadius: 999,

    },


    // ========================================================
    // TEMPO
    // ========================================================

    timeContainer: {

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      marginTop: 7,

    },


    timeText: {

      fontSize: 12,

      fontWeight:
        "600",

      color:
        "#64748b",

      fontVariant: [
        "tabular-nums",
      ],

    },


    // ========================================================
    // CONTROLES
    // ========================================================

    controls: {

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 22,

    },


    // ========================================================
    // PLAY
    // ========================================================

    playButton: {

      width: 64,

      height: 64,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#0f172a",

      borderRadius: 32,

    },


    playIcon: {

      fontSize: 24,

      fontWeight:
        "800",

      color:
        "#ffffff",

    },


    // ========================================================
    // VOLTAR / AVANÇAR
    // ========================================================

    secondaryButton: {

      width: 54,

      height: 54,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#f1f5f9",

      borderRadius: 27,

    },


    secondaryIcon: {

      fontSize: 21,

      fontWeight:
        "700",

      color:
        "#334155",

      lineHeight: 21,

    },


    secondaryText: {

      marginTop: -2,

      fontSize: 10,

      fontWeight:
        "700",

      color:
        "#64748b",

    },


    // ========================================================
    // REPETIR
    // ========================================================

    replayButton: {

      minHeight: 48,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 16,

      paddingHorizontal:
        12,

      borderTopWidth: 1,

      borderTopColor:
        "#e2e8f0",

    },


    replayIcon: {

      marginRight: 7,

      fontSize: 18,

      color:
        "#475569",

    },


    replayText: {

      fontSize: 13,

      fontWeight:
        "700",

      color:
        "#475569",

    },


    // ========================================================
    // DOWNLOAD
    // ========================================================

    downloadButton: {

      minHeight: 54,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 10,

      paddingHorizontal:
        18,

      backgroundColor:
        "#2563eb",

      borderRadius: 12,

    },


    downloadButtonText: {

      fontSize: 15,

      fontWeight:
        "800",

      color:
        "#ffffff",

    },


    // ========================================================
    // COMPARTILHAR
    // ========================================================

    shareButton: {

      minHeight: 50,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 10,

      paddingHorizontal:
        18,

      backgroundColor:
        "#f8fafc",

      borderWidth: 1,

      borderColor:
        "#cbd5e1",

      borderRadius: 12,

    },


    shareButtonText: {

      fontSize: 14,

      fontWeight:
        "700",

      color:
        "#475569",

    },


    // ========================================================
    // BOTÃO CARREGANDO
    // ========================================================

    loadingButton: {

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

    },


    disabledButton: {

      opacity: 0.55,

    },

  });