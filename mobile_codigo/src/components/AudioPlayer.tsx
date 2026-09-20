import React, {
  useEffect,
} from "react";

import {
  ActivityIndicator,
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
  // PLAYER
  // ==========================================================

  const player = useAudioPlayer(
    audioUrl,
    {
      updateInterval: 250,

      /*
        Faz o arquivo ser baixado antes da reprodução.

        Como nosso backend gera MP3 pequeno,
        isso normalmente deixa a reprodução mais estável.
      */
      downloadFirst: true,
    }
  );


  // ==========================================================
  // STATUS
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
          playsInSilentMode: true,

          /*
            O áudio não precisa continuar tocando
            em segundo plano por enquanto.
          */
          shouldPlayInBackground: false,

          /*
            Evita comportamento agressivo com
            outros aplicativos de áudio.
          */
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
  // DADOS DO PLAYER
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
            currentTime / duration,
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
        Se o áudio chegou ao final,
        volta para o começo antes de tocar.
      */

      if (
        duration > 0 &&
        currentTime >=
          duration - 0.1
      ) {

        await player.seekTo(0);

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
  // RECOMEÇAR
  // ==========================================================

  async function handleReplay() {

    try {

      if (!isLoaded) {
        return;
      }


      await player.seekTo(0);

      player.play();

    } catch (error) {

      console.error(
        "Erro ao reiniciar áudio:",
        error
      );

    }

  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <View style={styles.container}>

      {/* ================================================= */}
      {/* STATUS                                           */}
      {/* ================================================= */}

      {!isLoaded ? (

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

      ) : (

        <>

          {/* ============================================= */}
          {/* BARRA DE PROGRESSO                           */}
          {/* ============================================= */}

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


            {/* =========================================== */}
            {/* TEMPO                                      */}
            {/* =========================================== */}

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


          {/* ============================================= */}
          {/* CONTROLES                                    */}
          {/* ============================================= */}

          <View
            style={
              styles.controls
            }
          >

            {/* Voltar */}

            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={
                handleBackward
              }
              activeOpacity={0.7}
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


            {/* Play / Pause */}

            <TouchableOpacity
              style={
                styles.playButton
              }
              onPress={
                handlePlayPause
              }
              activeOpacity={0.8}
            >

              {
                isBuffering ? (

                  <ActivityIndicator
                    color="#ffffff"
                    size="small"
                  />

                ) : (

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


            {/* Avançar */}

            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={
                handleForward
              }
              activeOpacity={0.7}
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


          {/* ============================================= */}
          {/* REPETIR                                      */}
          {/* ============================================= */}

          <TouchableOpacity
            style={
              styles.replayButton
            }
            onPress={
              handleReplay
            }
            activeOpacity={0.7}
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

        </>

      )}

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
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {

    return "00:00";

  }


  const totalSeconds =
    Math.floor(seconds);


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const remainingSeconds =
    totalSeconds % 60;


  return (
    `${minutes
      .toString()
      .padStart(2, "0")}:` +
    `${remainingSeconds
      .toString()
      .padStart(2, "0")}`
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

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

    },


    loadingText: {

      marginLeft: 10,

      fontSize: 14,

      color: "#64748b",

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

      overflow: "hidden",

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

      flexDirection: "row",

      justifyContent:
        "space-between",

      marginTop: 7,

    },


    timeText: {

      fontSize: 12,

      fontWeight: "600",

      color: "#64748b",

      fontVariant: [
        "tabular-nums",
      ],

    },


    // ========================================================
    // CONTROLES
    // ========================================================

    controls: {

      flexDirection: "row",

      alignItems: "center",

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

      alignItems: "center",

      justifyContent:
        "center",

      backgroundColor:
        "#0f172a",

      borderRadius: 32,

    },


    playIcon: {

      fontSize: 24,

      fontWeight: "800",

      color: "#ffffff",

    },


    // ========================================================
    // VOLTAR / AVANÇAR
    // ========================================================

    secondaryButton: {

      width: 54,

      height: 54,

      alignItems: "center",

      justifyContent:
        "center",

      backgroundColor:
        "#f1f5f9",

      borderRadius: 27,

    },


    secondaryIcon: {

      fontSize: 21,

      fontWeight: "700",

      color: "#334155",

      lineHeight: 21,

    },


    secondaryText: {

      marginTop: -2,

      fontSize: 10,

      fontWeight: "700",

      color: "#64748b",

    },


    // ========================================================
    // REPETIR
    // ========================================================

    replayButton: {

      minHeight: 44,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      marginTop: 16,

      paddingHorizontal: 12,

      borderTopWidth: 1,

      borderTopColor:
        "#e2e8f0",

    },


    replayIcon: {

      marginRight: 7,

      fontSize: 18,

      color: "#475569",

    },


    replayText: {

      fontSize: 13,

      fontWeight: "700",

      color: "#475569",

    },

  });