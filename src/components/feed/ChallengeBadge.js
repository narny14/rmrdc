import React from "react";
import {View, Text, StyleSheet} from "react-native";

export default function ChallengeBadge() {
  return (
    <View style={styles.container}>
      <Text style={styles.small}>Challenge</Text>

      <Text style={styles.big}>Your Skills</Text>

      <Text style={styles.icon}>⚽</Text>
    </View>
  );
}

const styles = StyleSheet.create({

container:{
    position:'absolute',
    right:25,
    top:180
},

small:{
color:"#ccc",
fontSize:13
},

big:{
fontSize:18,
color:"#fff",
fontWeight:"700"
},

icon:{
fontSize:22,
marginTop:5
}

});