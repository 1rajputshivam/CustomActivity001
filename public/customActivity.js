window.onload = function () {
  const connection = new Postmonger.Session();
  let payload = {};

  connection.trigger('ready');

  // REQUIRED
  connection.trigger('requestInteraction', {
    interactionType: 'Button',
    callback: 'clickedNext'
  });

  connection.on('initActivity', data => {
    payload = data || {};

    const savedCountry =
      payload?.arguments?.execute?.inArguments?.find(a => a.country)?.country;

    if (savedCountry) {
      document.getElementById('country').value = savedCountry;
      document.getElementById('status').innerText =
        `Previously selected: ${savedCountry}`;
    }
  });

  connection.on('clickedNext', () => {
    const country = document.getElementById('country').value;

    payload.arguments = payload.arguments || {};
    payload.arguments.execute = payload.arguments.execute || {};
    payload.arguments.execute.inArguments = [
      { subscriberKey: '{{Contact.Key}}' },
      { country }
    ];

    payload.metaData.isConfigured = true;
    payload.metaData.label = `Country: ${country}`;
    payload.name = `Window Check (${country})`;

    connection.trigger('updateActivity', payload);
  });
};
