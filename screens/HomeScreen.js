import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MagnifyingGlassIcon, XMarkIcon } from "react-native-heroicons/outline";
import { CalendarDaysIcon, MapPinIcon } from "react-native-heroicons/solid";
import { debounce } from "lodash";
import { theme } from "../theme";
import { fetchLocations, fetchWeatherForecast } from "../api/weather";
import * as Progress from "react-native-progress";
import { StatusBar } from "expo-status-bar";
import { weatherImages } from "../constants";
import { getData, storeData } from "../utils/asyncStorage";
import * as Font from "expo-font";

export default function HomeScreen() {
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({});

  const handleSearch = (search) => {
    // console.log('value: ',search);
    if (search && search.length > 2)
      fetchLocations({ cityName: search }).then((data) => {
        // console.log('got locations: ',data);
        setLocations(data);
      });
  };

  const handleLocation = (loc) => {
    setLoading(true);
    toggleSearch(false);
    setLocations([]);
    fetchWeatherForecast({
      cityName: loc.name,
      days: "7",
    }).then((data) => {
      setLoading(false);
      setWeather(data);
      storeData("city", loc.name);
    });
  };
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const fetchMyWeatherData = async () => {
    let myCity = await getData("city");
    let cityName = "London";
    if (myCity) {
      cityName = myCity;
    }
    fetchWeatherForecast({
      cityName,
      days: "7",
    }).then((data) => {
      // console.log('got data: ',data.forecast.forecastday);
      setWeather(data);
      setLoading(false);
    });
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

  const { location, current } = weather;
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "SF-Pro-Text-Medium": require("../assets/fonts/SF-Pro-Text-Medium.otf"),
        "SF-Pro-Text-Bold": require("../assets/fonts/SF-Pro-Text-Bold.otf"),
        "SF-Pro-Text-Regular": require("../assets/fonts/SF-Pro-Text-Regular.otf"),
        "Whisper-Regular": require("../assets/fonts/Whisper-Regular.ttf"),
      });
      setFontsLoaded(true);
    };

    loadFonts();

    fetchMyWeatherData();
  }, []);
  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView className="flex flex-1">
      <View style={styles.container}>
        <View className="flex-1 relative">
          <StatusBar style="dark" />
          <Image
            source={require("../assets/images/bg.png")}
            className="absolute w-full h-full"
          />
          {loading ? (
            <View className="flex-1 flex-row justify-center items-center">
              <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
            </View>
          ) : (
            <>
              {/* search section */}
              <View
                style={{ height: "7%" }}
                className="mx-4 mt-3 relative z-50"
              >
                <View
                  className="flex-row justify-end items-center rounded-full"
                  style={{
                    backgroundColor: showSearch
                      ? theme.bgWhite(0.15)
                      : "transparent",
                  }}
                >
                  {showSearch ? (
                    <TextInput
                      onChangeText={handleTextDebounce}
                      placeholder="Search city"
                      placeholderTextColor={"white"}
                      className="pl-6 h-10 pb-1 flex-1 text-base text-white"
                    />
                  ) : null}
                  <TouchableOpacity
                    onPress={() => toggleSearch(!showSearch)}
                    className="rounded-full p-3 m-1"
                    style={{ backgroundColor: theme.bgWhite(0.15) }}
                  >
                    {showSearch ? (
                      <XMarkIcon size="25" color="white" />
                    ) : (
                      <MagnifyingGlassIcon size="25" color="white" />
                    )}
                  </TouchableOpacity>
                </View>
                {locations.length > 0 && showSearch ? (
                  <View
                    style={{ backgroundColor: theme.bgWhite(0.15) }}
                    className="absolute w-full  top-16 rounded-3xl "
                  >
                    {locations.map((loc, index) => {
                      let showBorder = index + 1 != locations.length;
                      let borderClass = showBorder
                        ? " border-b-2 border-b-gray-400"
                        : "";
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleLocation(loc)}
                          className={
                            "flex-row items-center border-0 p-3 px-4 mb-1 " +
                            borderClass
                          }
                        >
                          <MapPinIcon size="20" color="gray" />
                          <Text className="text-black text-lg ml-2">
                            {loc?.name}, {loc?.country}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {/* forecast section */}
              <View className="mx-4 flex justify-around flex-1 mb-2">
                {/* location */}
                <Text className="text-white text-center text-2xl font-bold">
                  <Text style={styles.city}>{location?.name},</Text>
                  <Text
                    style={styles.country}
                    className="text-lg font-semibold text-white"
                  >
                    {" " + location?.country}
                  </Text>
                </Text>
                {/* weather icon */}
                <View className="flex-row justify-center">
                  <Image
                    // source={{uri: 'https:'+current?.condition?.icon}}
                    source={weatherImages[current?.condition?.text || "other"]}
                    className="w-52 h-52"
                  />
                </View>
                {/* degree celcius */}
                <View className="space-y-2">
                  <Text
                    style={styles.materialText}
                    className="text-center font-bold text-white text-6xl ml-5"
                  >
                    {current?.temp_c}&#176;
                  </Text>
                  <Text className="text-center text-white text-xl tracking-widest">
                    {current?.condition?.text}
                  </Text>
                </View>

                {/* other stats */}
                <View className="flex-row justify-between mx-4">
                  <View className="flex-row space-x-2 items-center">
                    <Image
                      source={require("../assets/icons/wind.png")}
                      className="w-6 h-6"
                    />
                    <Text
                      stye={styles.smallText}
                      className="text-white font-semibold"
                    >
                      {current?.wind_kph}km
                    </Text>
                  </View>
                  <View className="flex-row space-x-2 items-center">
                    <Image
                      source={require("../assets/icons/drop.png")}
                      className="w-6 h-6"
                    />
                    <Text
                      stye={styles.smallText}
                      className="text-white font-semibold "
                    >
                      {current?.humidity}%
                    </Text>
                  </View>
                  <View className="flex-row space-x-2 items-center">
                    <Image
                      source={require("../assets/icons/sun.png")}
                      className="w-6 h-6"
                    />
                    <Text
                      stye={styles.smallText}
                      className="text-white font-semibold "
                    >
                      {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                    </Text>
                  </View>
                </View>
              </View>

              {/* forecast for next days */}
              <View className="mb-2 space-y-3">
                <View className="flex-row items-center mx-5 space-x-2">
                  <CalendarDaysIcon size="22" color="white" />
                  <Text style={styles.dailyForcast} className="text-white ">
                    Daily forecast
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  showsHorizontalScrollIndicator={false}
                >
                  {weather?.forecast?.forecastday?.map((item, index) => {
                    const date = new Date(item.date);
                    const options = { weekday: "long" };
                    let dayName = date.toLocaleDateString("en-US", options);
                    dayName = dayName.split(",")[0];

                    return (
                      <View
                        key={index}
                        className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
                        style={{ backgroundColor: theme.bgWhite(0.15) }}
                      >
                        <Image
                          // source={{uri: 'https:'+item?.day?.condition?.icon}}
                          source={
                            weatherImages[item?.day?.condition?.text || "other"]
                          }
                          className="w-11 h-11"
                        />
                        <Text style={styles.days} className="text-white">
                          {dayName}
                        </Text>
                        <Text className="text-white text-base font-semibold">
                          {item?.day?.avgtemp_c}&#176;
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  materialText: {
    fontSize: 60,
    fontFamily: "SF-Pro-Text-Medium",
  },
  city: {
    fontSize: 26,
    fontFamily: "SF-Pro-Text-Medium",
  },
  country: {
    fontSize: 19,
    fontFamily: "SF-Pro-Text-Medium",
  },
  days: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 15,
  },
  smallText: {
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 18,
  },
  dailyForcast: {
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 18,
  },
});
